import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createUser, findUserByEmail } from '../services/user.service';

async function registerHandler(req: any, res: any) {
  const { email, password } = req.body as { email: string; password: string };
  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'EmailInUse' });
  const user = await createUser(email, password);
  const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: '15m' });
  return res.status(201).json({ token, user: { id: user.id, email: user.email, createdAt: user.createdAt } });
}

async function loginHandler(req: any, res: any) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'InvalidCredentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'InvalidCredentials' });
  const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, { expiresIn: '15m' });
  return res.json({ token, user: { id: user.id, email: user.email } });
}

export { loginHandler, registerHandler };
