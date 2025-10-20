import { Router } from 'express';
import Joi from 'joi';

import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { HttpError } from '../../middleware/error-handler';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';

const router = Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  companyName: Joi.string().allow('', null),
  brandColor: Joi.string().allow('', null),
  themePreference: Joi.string().valid('light', 'dark', 'system').default('light')
});

router.post('/register', async (req, res) => {
  const { value, error } = registerSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const existing = await prisma.user.findUnique({ where: { email: value.email } });
  if (existing) throw new HttpError(409, 'Email already registered');

  const passwordHash = await hashPassword(value.password);
  const user = await prisma.user.create({
    data: {
      email: value.email,
      passwordHash,
      name: value.name,
      companyName: value.companyName || null,
      brandColor: value.brandColor || null,
      themePreference: value.themePreference || null
    }
  });

  const token = signToken({ userId: user.id });

  res.status(201).json({ token, user: { ...user, passwordHash: undefined } });
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/login', async (req, res) => {
  const { value, error } = loginSchema.validate(req.body);
  if (error) throw new HttpError(400, 'Invalid payload', error.details);

  const user = await prisma.user.findUnique({ where: { email: value.email } });
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const match = await comparePassword(value.password, user.passwordHash);
  if (!match) throw new HttpError(401, 'Invalid credentials');

  const token = signToken({ userId: user.id });
  res.json({ token, user: { ...user, passwordHash: undefined } });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new HttpError(404, 'User not found');

  const { passwordHash, ...rest } = user;
  res.json(rest);
});

export const authRouter = router;
