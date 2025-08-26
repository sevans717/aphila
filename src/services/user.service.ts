import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { email, password: hashedPassword } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function updateUserProfile(userId: string, data: Partial<{ displayName: string; bio: string; location: string; latitude: number | null; longitude: number | null }>) {
  // update or create profile row
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    return prisma.profile.update({ where: { userId }, data });
  }
  return prisma.profile.create({ data: { userId, displayName: data.displayName || 'User', bio: data.bio || '', location: data.location || null, latitude: data.latitude ?? null, longitude: data.longitude ?? null, birthdate: new Date('1990-01-01'), gender: 'OTHER', orientation: 'OTHER' } as any });
}
