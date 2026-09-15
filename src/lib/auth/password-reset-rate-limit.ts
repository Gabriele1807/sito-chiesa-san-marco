/**
 * Rate limiting per forgot-password / reset-password. Stesso pattern
 * null-fallback di src/lib/auth/rate-limit.ts (design spec §6).
 */

import { getRedis } from "@/lib/redis/client";

const EMAIL_MAX_PER_MINUTE = 1;
const EMAIL_MAX_PER_DAY = 5;
const IP_MAX_PER_MINUTE = 5;
const IP_MAX_PER_DAY = 20;
const RESET_IP_MAX_PER_HOUR = 20;

const MINUTE = 60;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

interface WindowRecord {
  count: number;
  firstAt: number;
}

const memory = new Map<string, WindowRecord>();

async function incrWithWindow(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return count;
  }
  const record = memory.get(key);
  if (!record || Date.now() - record.firstAt > windowSeconds * 1000) {
    memory.set(key, { count: 1, firstAt: Date.now() });
    return 1;
  }
  record.count++;
  return record.count;
}

async function getCount(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    return (await redis.get<number>(key)) ?? 0;
  }
  const record = memory.get(key);
  if (!record || Date.now() - record.firstAt > windowSeconds * 1000) return 0;
  return record.count;
}

export async function isForgotPasswordRateLimited(ip: string, email: string): Promise<boolean> {
  const [emailMinute, emailDay, ipMinute, ipDay] = await Promise.all([
    getCount(`ratelimit:forgot-password:email:${email}:m`, MINUTE),
    getCount(`ratelimit:forgot-password:email:${email}:d`, DAY),
    getCount(`ratelimit:forgot-password:ip:${ip}:m`, MINUTE),
    getCount(`ratelimit:forgot-password:ip:${ip}:d`, DAY),
  ]);
  return (
    emailMinute >= EMAIL_MAX_PER_MINUTE ||
    emailDay >= EMAIL_MAX_PER_DAY ||
    ipMinute >= IP_MAX_PER_MINUTE ||
    ipDay >= IP_MAX_PER_DAY
  );
}

export async function recordForgotPasswordAttempt(ip: string, email: string): Promise<void> {
  await Promise.all([
    incrWithWindow(`ratelimit:forgot-password:email:${email}:m`, MINUTE),
    incrWithWindow(`ratelimit:forgot-password:email:${email}:d`, DAY),
    incrWithWindow(`ratelimit:forgot-password:ip:${ip}:m`, MINUTE),
    incrWithWindow(`ratelimit:forgot-password:ip:${ip}:d`, DAY),
  ]);
}

export async function isResetPasswordRateLimited(ip: string): Promise<boolean> {
  const count = await getCount(`ratelimit:reset-password:ip:${ip}`, HOUR);
  return count >= RESET_IP_MAX_PER_HOUR;
}

export async function recordResetPasswordAttempt(ip: string): Promise<void> {
  await incrWithWindow(`ratelimit:reset-password:ip:${ip}`, HOUR);
}
