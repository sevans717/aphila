import { prisma } from "../lib/prisma";

export async function checkDatabaseReady(timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Lightweight query
    await prisma.$queryRaw`SELECT 1`;
    clearTimeout(timer);
    return { ok: true };
  } catch (err: any) {
    clearTimeout(timer);
    return { ok: false, error: err.message || String(err) };
  }
}
