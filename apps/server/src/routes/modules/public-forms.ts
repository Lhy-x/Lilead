import { Router } from 'express';
import Joi from 'joi';
import crypto from 'node:crypto';

import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error-handler';
import { submissionRateLimiter, verificationRateLimiter } from '../../middleware/rate-limit';
import { sendVerificationEmail } from '../../utils/email';
import { evaluateLead } from '../../utils/ai';

const router = Router();

const verificationSchema = Joi.object({
  email: Joi.string().email().required(),
  honeypot: Joi.string().allow('', null)
});

router.post('/:slug/visit', async (req, res) => {
  const form = await prisma.form.findUnique({ where: { slug: req.params.slug } });
  if (!form) throw new HttpError(404, 'Form not found');

  const visitorId = (req.body?.visitorId as string) || crypto.randomUUID();
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

  await prisma.visit.create({
    data: {
      formId: form.id,
      visitorId,
      ipHash,
      userAgent: req.headers['user-agent']?.toString()
    }
  });

  res.json({ visitorId });
});

router.get('/:slug', async (req, res) => {
  const form = await prisma.form.findUnique({
    where: { slug: req.params.slug },
    include: { questions: { orderBy: { order: 'asc' } } }
  });
  if (!form || (!form.isPublished && !form.enableTestMode)) throw new HttpError(404, 'Form not found');

  res.json({
    id: form.id,
    name: form.name,
    description: form.description,
    accentColor: form.accentColor,
    theme: form.theme,
    successTitle: form.successTitle,
    successMessage: form.successMessage,
    successVideoUrl: form.successVideoUrl,
    enableTestMode: form.enableTestMode,
    questions: form.questions
  });
});

router.post('/:slug/request-verification', verificationRateLimiter, async (req, res) => {
  const { value, error } = verificationSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);
  if (value.honeypot) throw new HttpError(400, 'Spam detected');

  const form = await prisma.form.findUnique({ where: { slug: req.params.slug } });
  if (!form) throw new HttpError(404, 'Form not found');

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + env.verificationExpiryMinutes * 60 * 1000);

  const verification = await prisma.emailVerification.upsert({
    where: {
      email_formId: {
        email: value.email,
        formId: form.id
      }
    },
    create: {
      email: value.email,
      formId: form.id,
      code,
      expiresAt
    },
    update: {
      code,
      expiresAt,
      verifiedAt: null
    }
  });

  await sendVerificationEmail(value.email, code, form.name, form.id);

  res.json({ message: 'Verification email sent', expiresAt: verification.expiresAt });
});

const confirmSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required()
});

router.post('/:slug/confirm-verification', async (req, res) => {
  const { value, error } = confirmSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const form = await prisma.form.findUnique({ where: { slug: req.params.slug } });
  if (!form) throw new HttpError(404, 'Form not found');

  const verification = await prisma.emailVerification.findUnique({
    where: {
      email_formId: {
        email: value.email,
        formId: form.id
      }
    }
  });

  if (!verification || verification.code !== value.code) throw new HttpError(400, 'Invalid code');
  if (verification.expiresAt < new Date()) throw new HttpError(400, 'Verification expired');

  const updated = await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { verifiedAt: new Date() }
  });

  res.json({ message: 'Email verified', verificationId: updated.id });
});

const submissionSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().required(),
        value: Joi.string().allow('')
      })
    )
    .required(),
  metadata: Joi.object({
    visitorId: Joi.string().allow('', null)
  }).default({}),
  honeypot: Joi.string().allow('', null),
  mode: Joi.string().valid('live', 'test').default('live')
});

router.post('/:slug/submit', submissionRateLimiter, async (req, res) => {
  const { value, error } = submissionSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);
  if (value.honeypot) throw new HttpError(400, 'Spam detected');

  const form = await prisma.form.findUnique({
    where: { slug: req.params.slug },
    include: { questions: true }
  });
  if (!form) throw new HttpError(404, 'Form not found');

  if (value.mode === 'live' && !form.isPublished) throw new HttpError(400, 'Form not published');
  if (value.mode === 'test' && !form.enableTestMode) throw new HttpError(403, 'Test mode disabled');

  const verification = await prisma.emailVerification.findUnique({
    where: {
      email_formId: {
        email: value.email,
        formId: form.id
      }
    }
  });

  if (!verification || !verification.verifiedAt) throw new HttpError(400, 'Email not verified');
  if (verification.expiresAt < new Date()) throw new HttpError(400, 'Verification expired');

  const requiredQuestions = form.questions.filter((question) => question.isRequired);
  for (const question of requiredQuestions) {
    const answer = value.answers.find((ans) => ans.questionId === question.id);
    if (!answer || !answer.value) {
      throw new HttpError(400, `Missing answer for required question: ${question.label}`);
    }
  }

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      leadEmail: value.email,
      leadPhone: value.phone || null,
      isTestSubmission: value.mode === 'test',
      answers: {
        create: value.answers.map((answer) => ({
          questionId: answer.questionId,
          value: answer.value
        }))
      },
      verification: {
        connect: { id: verification.id }
      }
    },
    include: { answers: { include: { question: true } } }
  });

  const features = submission.answers.map((answer) => ({
    questionId: answer.questionId,
    label: answer.question.label,
    value: answer.value
  }));

  const evaluation = await evaluateLead(form.id, features, submission.leadEmail || undefined);

  const updatedSubmission = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: evaluation.status,
      aiScore: evaluation.score,
      aiSummary: evaluation.summary
    }
  });

  res.status(201).json({ submission: updatedSubmission, evaluation });
});

export const publicFormRouter = router;
