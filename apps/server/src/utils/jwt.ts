import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export const signToken = (payload: Record<string, unknown>, expiresIn = '7d') =>
  jwt.sign(payload, env.jwtSecret, { expiresIn });
