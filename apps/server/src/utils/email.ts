import sgMail from '@sendgrid/mail';

import { env } from '../config/env';
import { prisma } from '../config/prisma';

if (env.sendgridKey) {
  sgMail.setApiKey(env.sendgridKey);
}

type EmailTemplate = 'verification' | 'qualified-leads' | 'reminder';

const templates: Record<EmailTemplate, (data: Record<string, string>) => string> = {
  verification: ({ code, formName }) => `Bonjour,\n\nVoici votre code de vérification pour ${formName} : ${code}\n\nMerci !`,
  'qualified-leads': ({ formName, link }) =>
    `Bonjour,\n\nVoici la liste des leads qualifiés pour ${formName}. Consultez le dashboard : ${link}\n\nÀ très vite !`,
  reminder: ({ formName }) =>
    `Bonjour,\n\nNous n'avons pas encore reçu votre confirmation pour ${formName}. Retournez sur le formulaire pour finaliser votre demande.\n\nMerci !`
};

export const sendEmail = async (
  to: string,
  subject: string,
  template: EmailTemplate,
  data: Record<string, string>,
  metadata?: { formId?: string; submissionId?: string }
) => {
  if (!env.sendgridKey) {
    console.warn('Sendgrid key missing, email not sent.');
    return;
  }

  const html = templates[template](data).replace(/\n/g, '<br/>');
  const text = templates[template](data);

  try {
    await sgMail.send({
      to,
      from: env.sendgridFrom,
      subject,
      text,
      html
    });

    await prisma.emailLog.create({
      data: {
        toEmail: to,
        template,
        status: 'SENT',
        formId: metadata?.formId,
        submissionId: metadata?.submissionId
      }
    });
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        toEmail: to,
        template,
        status: 'FAILED',
        error: JSON.stringify(error),
        formId: metadata?.formId,
        submissionId: metadata?.submissionId
      }
    });
    throw error;
  }
};

export const sendVerificationEmail = async (
  to: string,
  code: string,
  formName: string,
  formId: string,
  submissionId?: string
) =>
  sendEmail(
    to,
    `Vérification de votre adresse email pour ${formName}`,
    'verification',
    { code, formName },
    { formId, submissionId }
  );

export const sendQualifiedLeadsEmail = async (to: string, formName: string, dashboardLink: string) =>
  sendEmail(
    to,
    `Leads qualifiés pour ${formName}`,
    'qualified-leads',
    { formName, link: dashboardLink }
  );
