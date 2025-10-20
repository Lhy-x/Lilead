import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  resendKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'no-reply@example.com',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  verificationExpiryMinutes: Number(process.env.VERIFICATION_EXPIRY_MINUTES || 30)
};
