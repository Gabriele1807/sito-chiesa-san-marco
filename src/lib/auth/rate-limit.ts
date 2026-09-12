/**
 * Rate limiting per tentativi di login e richieste pubbliche.
 *
 * Dopo 5 tentativi falliti dallo stesso IP in 15 minuti,
 * blocca temporaneamente ulteriori tentativi di login.
 *
 * Dopo 60 richieste dallo stesso IP in 1 minuto,
 * blocca temporaneamente ulteriori richieste generiche.
 *
 * Backend: Redis (Upstash, via src/lib/redis/client.ts) quando
 * UPSTASH_REDIS_REST_URL/TOKEN sono configurate — contatore condiviso tra
 * tutte le istanze serverless, con `INCR` + `EXPIRE` per finestra scorrevole.
 * Se Redis non è configurato (es. sviluppo locale), ricade sulla Map in
 * memoria di processo usata in precedenza: il limite resta "per istanza",
 * come prima di questa modifica — vedi PROJECT_CONTEXT.md sezione sicurezza.
 */

import { getRedis } from "@/lib/redis/client";

const MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minuti

const MAX_REQUESTS = 60;
const REQUEST_WINDOW_SECONDS = 60; // 1 minuto

interface LoginAttempt {
  count: number;
  firstAttempt: number;
}

interface RequestAttempt {
  count: number;
  firstRequest: number;
}

// Fallback in memoria di processo, usato solo quando Redis non è configurato.
const attempts = new Map<string, LoginAttempt>();
const requestAttempts = new Map<string, RequestAttempt>();

function loginKey(ip: string): string {
  return `ratelimit:login:${ip}`;
}

function requestKey(ip: string): string {
  return `ratelimit:request:${ip}`;
}

/**
 * Incrementa un contatore Redis con finestra scorrevole: imposta la
 * scadenza solo al primo incremento della finestra, così `EXPIRE` non
 * viene resettato ad ogni richiesta.
 */
async function redisIncrWithWindow(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string,
  windowSeconds: number
): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

/**
 * Verifica se un IP è bloccato per troppi tentativi di login.
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const count = (await redis.get<number>(loginKey(ip))) ?? 0;
    return count >= MAX_ATTEMPTS;
  }

  const record = attempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstAttempt > LOGIN_WINDOW_SECONDS * 1000) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

/**
 * Registra un tentativo di login fallito per un IP.
 */
export async function recordFailedAttempt(ip: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redisIncrWithWindow(redis, loginKey(ip), LOGIN_WINDOW_SECONDS);
    return;
  }

  const record = attempts.get(ip);
  if (!record || Date.now() - record.firstAttempt > LOGIN_WINDOW_SECONDS * 1000) {
    attempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count++;
  }
}

/**
 * Resetta i tentativi per un IP (dopo login riuscito).
 */
export async function resetAttempts(ip: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(loginKey(ip));
    return;
  }
  attempts.delete(ip);
}

/**
 * Restituisce quanti tentativi rimangono per un IP.
 */
export async function remainingAttempts(ip: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = (await redis.get<number>(loginKey(ip))) ?? 0;
    return Math.max(0, MAX_ATTEMPTS - count);
  }

  const record = attempts.get(ip);
  if (!record) return MAX_ATTEMPTS;
  if (Date.now() - record.firstAttempt > LOGIN_WINDOW_SECONDS * 1000) {
    return MAX_ATTEMPTS;
  }
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

/**
 * Verifica se un IP ha superato il limite delle richieste generiche.
 */
export async function isIpRateLimited(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const count = (await redis.get<number>(requestKey(ip))) ?? 0;
    return count >= MAX_REQUESTS;
  }

  const record = requestAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstRequest > REQUEST_WINDOW_SECONDS * 1000) {
    requestAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_REQUESTS;
}

/**
 * Registra una richiesta pubblica per un IP.
 */
export async function recordIpRequest(ip: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redisIncrWithWindow(redis, requestKey(ip), REQUEST_WINDOW_SECONDS);
    return;
  }

  const record = requestAttempts.get(ip);
  if (!record || Date.now() - record.firstRequest > REQUEST_WINDOW_SECONDS * 1000) {
    requestAttempts.set(ip, { count: 1, firstRequest: Date.now() });
  } else {
    record.count++;
  }
}

/**
 * Restituisce il numero di richieste rimaste per un IP.
 */
export async function remainingIpRequests(ip: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = (await redis.get<number>(requestKey(ip))) ?? 0;
    return Math.max(0, MAX_REQUESTS - count);
  }

  const record = requestAttempts.get(ip);
  if (!record) return MAX_REQUESTS;
  if (Date.now() - record.firstRequest > REQUEST_WINDOW_SECONDS * 1000) {
    return MAX_REQUESTS;
  }
  return Math.max(0, MAX_REQUESTS - record.count);
}

/**
 * Estrae l’indirizzo IP client dalle intestazioni standard.
 */
export function getClientIp(request: Request | { headers: Headers }): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
