import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  sendgridKey: process.env.SENDGRID_API_KEY || '',
  sendgridFrom: process.env.SENDGRID_FROM || 'no-reply@example.com',
  aiApiKey: process.env.AI_API_KEY || '',
  aiApiUrl: process.env.AI_API_URL || '',
  verificationExpiryMinutes: Number(process.env.VERIFICATION_EXPIRY_MINUTES || 30)
};
