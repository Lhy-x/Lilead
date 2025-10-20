import { Express } from 'express';

import { authRouter } from './modules/auth';
import { formRouter } from './modules/forms';
import { publicFormRouter } from './modules/public-forms';
import { statsRouter } from './modules/stats';

export const registerRoutes = (app: Express) => {
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRouter);
  app.use('/forms', formRouter);
  app.use('/public/forms', publicFormRouter);
  app.use('/stats', statsRouter);
};
