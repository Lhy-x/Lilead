import { Router } from 'express';

import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { HttpError } from '../../middleware/error-handler';

const router = Router();
router.use(authenticate);

router.get('/overview', async (req, res) => {
  const forms = await prisma.form.findMany({ where: { userId: req.userId } });
  const formIds = forms.map((form) => form.id);

  const [submissions, visits, qualified, verified] = await Promise.all([
    prisma.submission.count({ where: { formId: { in: formIds }, isTestSubmission: false } }),
    prisma.visit.count({ where: { formId: { in: formIds } } }),
    prisma.submission.count({ where: { formId: { in: formIds }, status: 'QUALIFIED', isTestSubmission: false } }),
    prisma.emailVerification.count({ where: { formId: { in: formIds }, verifiedAt: { not: null } } })
  ]);

  const verificationTotal = await prisma.emailVerification.count({ where: { formId: { in: formIds } } });

  res.json({
    forms: forms.length,
    submissions,
    visits,
    qualified,
    verificationRate: verificationTotal ? Math.round((verified / verificationTotal) * 100) : 0,
    conversionRate: visits ? Math.round((submissions / visits) * 100) : 0
  });
});

router.get('/forms/:formId', async (req, res) => {
  const form = await prisma.form.findFirst({ where: { id: req.params.formId, userId: req.userId } });
  if (!form) throw new HttpError(404, 'Form not found');

  const [submissions, visits, qualified, verificationTotal, verified] = await Promise.all([
    prisma.submission.count({ where: { formId: form.id, isTestSubmission: false } }),
    prisma.visit.count({ where: { formId: form.id } }),
    prisma.submission.count({ where: { formId: form.id, status: 'QUALIFIED', isTestSubmission: false } }),
    prisma.emailVerification.count({ where: { formId: form.id } }),
    prisma.emailVerification.count({ where: { formId: form.id, verifiedAt: { not: null } } })
  ]);

  const recentSubmissions = await prisma.submission.findMany({
    where: {
      formId: form.id,
      isTestSubmission: false,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    select: { createdAt: true }
  });

  const dailyMap = recentSubmissions.reduce<Record<string, number>>((acc, submission) => {
    const day = submission.createdAt.toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  res.json({
    form,
    metrics: {
      submissions,
      visits,
      qualified,
      verificationRate: verificationTotal ? Math.round((verified / verificationTotal) * 100) : 0,
      conversionRate: visits ? Math.round((submissions / visits) * 100) : 0,
      daily: Object.entries(dailyMap).map(([date, count]) => ({
        date,
        count
      }))
    }
  });
});

export const statsRouter = router;
