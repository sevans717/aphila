import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { email, password: hashedPassword } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
