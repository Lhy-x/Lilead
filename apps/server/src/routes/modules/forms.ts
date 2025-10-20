import { Router } from 'express';
import Joi from 'joi';
import { customAlphabet } from 'nanoid';

import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { HttpError } from '../../middleware/error-handler';
import { sendQualifiedLeadsEmail } from '../../utils/email';
import { evaluateLead } from '../../utils/ai';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 12);

const router = Router();
router.use(authenticate);

const formSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  accentColor: Joi.string().allow('', null),
  theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
  successTitle: Joi.string().allow('', null),
  successMessage: Joi.string().allow('', null),
  successVideoUrl: Joi.string().uri().allow('', null),
  enableTestMode: Joi.boolean().default(false)
});

router.get('/', async (req, res) => {
  const forms = await prisma.form.findMany({
    where: { userId: req.userId },
    include: {
      _count: { select: { submissions: true, visits: true } }
    }
  });
  res.json(forms);
});

router.post('/', async (req, res) => {
  const { value, error } = formSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const slugCandidate = `${value.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  let slug = slugCandidate;
  let exists = await prisma.form.findUnique({ where: { slug } });
  if (exists) {
    slug = `${slugCandidate}-${nanoid(6)}`;
    exists = await prisma.form.findUnique({ where: { slug } });
    if (exists) slug = `${slugCandidate}-${nanoid(8)}`;
  }

  const form = await prisma.form.create({
    data: {
      userId: req.userId!,
      name: value.name,
      description: value.description || null,
      accentColor: value.accentColor || null,
      theme: value.theme || null,
      successTitle: value.successTitle || null,
      successMessage: value.successMessage || null,
      successVideoUrl: value.successVideoUrl || null,
      enableTestMode: value.enableTestMode ?? false,
      slug
    }
  });

  res.status(201).json(form);
});

router.get('/:id', async (req, res) => {
  const form = await prisma.form.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      questions: { orderBy: { order: 'asc' } },
      submissions: {
        take: 25,
        orderBy: { createdAt: 'desc' },
        include: { answers: true, verification: true }
      },
      leadRules: true
    }
  });
  if (!form) throw new HttpError(404, 'Form not found');
  res.json(form);
});

router.put('/:id', async (req, res) => {
  const { value, error } = formSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const updated = await prisma.form.update({
    where: { id: form.id },
    data: {
      name: value.name,
      description: value.description || null,
      accentColor: value.accentColor || null,
      theme: value.theme || null,
      successTitle: value.successTitle || null,
      successMessage: value.successMessage || null,
      successVideoUrl: value.successVideoUrl || null,
      enableTestMode: value.enableTestMode ?? form.enableTestMode
    }
  });

  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  await prisma.form.delete({ where: { id: form.id } });
  res.status(204).send();
});

const questionSchema = Joi.object({
  label: Joi.string().required(),
  helperText: Joi.string().allow('', null),
  type: Joi.string().valid('EMAIL', 'PHONE', 'SHORT_TEXT', 'LONG_TEXT', 'CHATBOX').required(),
  isRequired: Joi.boolean().default(false),
  order: Joi.number().integer().min(0).required()
});

router.post('/:id/questions', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const questionsCount = await prisma.question.count({ where: { formId: form.id } });
  if (questionsCount >= 30) throw new HttpError(400, 'Maximum number of questions reached');

  const { value, error } = questionSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const question = await prisma.question.create({
    data: {
      formId: form.id,
      label: value.label,
      helperText: value.helperText || null,
      type: value.type,
      isRequired: value.isRequired ?? false,
      order: value.order
    }
  });

  res.status(201).json(question);
});

router.put('/:id/questions/:questionId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const { value, error } = questionSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const question = await prisma.question.findFirst({
    where: { id: req.params.questionId, formId: form.id }
  });
  if (!question) throw new HttpError(404, 'Question not found');

  const updated = await prisma.question.update({
    where: { id: question.id },
    data: {
      label: value.label,
      helperText: value.helperText || null,
      type: value.type,
      isRequired: value.isRequired ?? question.isRequired,
      order: value.order
    }
  });

  res.json(updated);
});

router.delete('/:id/questions/:questionId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const question = await prisma.question.findFirst({
    where: { id: req.params.questionId, formId: form.id }
  });
  if (!question) throw new HttpError(404, 'Question not found');

  await prisma.question.delete({ where: { id: question.id } });
  res.status(204).send();
});

router.post('/:id/publish', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const updated = await prisma.form.update({
    where: { id: form.id },
    data: { isPublished: !form.isPublished }
  });
  res.json(updated);
});

router.post('/:id/notify-qualified', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const leads = await prisma.submission.findMany({
    where: { formId: form.id, status: 'QUALIFIED', isTestSubmission: false, leadEmail: { not: null } }
  });

  await sendQualifiedLeadsEmail(
    req.body.targetEmail || (await prisma.user.findUnique({ where: { id: req.userId! } }))?.email!,
    form.name,
    `${req.headers.origin || 'https://app.example.com'}/dashboard/forms/${form.id}`
  );

  res.json({ message: `${leads.length} leads qualifiés notifiés` });
});

router.post('/:id/manual-evaluate/:submissionId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const submission = await prisma.submission.findUnique({
    where: { id: req.params.submissionId },
    include: { answers: { include: { question: true } } }
  });
  if (!submission) throw new HttpError(404, 'Submission not found');

  const features = submission.answers.map((answer) => ({
    questionId: answer.questionId,
    label: answer.question.label,
    value: answer.value
  }));

  const evaluation = await evaluateLead(form.id, features, submission.leadEmail || undefined);

  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: evaluation.status,
      aiScore: evaluation.score,
      aiSummary: evaluation.summary
    }
  });

  res.json(updated);
});

const ruleSchema = Joi.object({
  fieldKey: Joi.string().required(),
  operator: Joi.string().valid('contains', 'equals', 'starts_with', 'ends_with').required(),
  value: Joi.string().required(),
  weight: Joi.number().min(0).max(10).default(1)
});

router.get('/:id/rules', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const rules = await prisma.leadRule.findMany({ where: { formId: form.id } });
  res.json(rules);
});

router.post('/:id/rules', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const { value, error } = ruleSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const rule = await prisma.leadRule.create({
    data: {
      userId: req.userId!,
      formId: form.id,
      fieldKey: value.fieldKey,
      operator: value.operator,
      value: value.value,
      weight: value.weight
    }
  });

  res.status(201).json(rule);
});

router.put('/:id/rules/:ruleId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const { value, error } = ruleSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const existing = await prisma.leadRule.findFirst({ where: { id: req.params.ruleId, formId: form.id } });
  if (!existing) throw new HttpError(404, 'Rule not found');

  const rule = await prisma.leadRule.update({
    where: { id: existing.id },
    data: {
      fieldKey: value.fieldKey,
      operator: value.operator,
      value: value.value,
      weight: value.weight
    }
  });

  res.json(rule);
});

router.delete('/:id/rules/:ruleId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const existing = await prisma.leadRule.findFirst({ where: { id: req.params.ruleId, formId: form.id } });
  if (!existing) throw new HttpError(404, 'Rule not found');

  await prisma.leadRule.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export const formRouter = router;
