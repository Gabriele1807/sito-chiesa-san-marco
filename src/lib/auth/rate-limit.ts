/**
 * Rate limiting in memoria per tentativi di login.
 *
 * Dopo 5 tentativi falliti dallo stesso IP in 15 minuti,
 * blocca temporaneamente ulteriori tentativi.
 *
 * FUTURO: Sostituire con Redis o Supabase per funzionare
 * correttamente in ambienti multi-istanza (es. Vercel serverless).
 * Con Redis: usare INCR + EXPIRE per contatore IP con TTL 15 min.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minuti

interface LoginAttempt {
  count: number;
  firstAttempt: number;
}

// Map in memoria: IP → tentativi
// FUTURO: Redis → INCR login_attempts:{ip} + EXPIRE 900
const attempts = new Map<string, LoginAttempt>();

/**
 * Verifica se un IP è bloccato per troppi tentativi.
 */
export function isRateLimited(ip: string): boolean {
  const record = attempts.get(ip);
  if (!record) return false;

  // Finestra scaduta: resetta
  if (Date.now() - record.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

/**
 * Registra un tentativo di login fallito per un IP.
 */
export function recordFailedAttempt(ip: string): void {
  const record = attempts.get(ip);

  if (!record || Date.now() - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    record.count++;
  }
}

/**
 * Resetta i tentativi per un IP (dopo login riuscito).
 */
export function resetAttempts(ip: string): void {
  attempts.delete(ip);
}

/**
 * Restituisce quanti tentativi rimangono per un IP.
 */
export function remainingAttempts(ip: string): number {
  const record = attempts.get(ip);
  if (!record) return MAX_ATTEMPTS;

  if (Date.now() - record.firstAttempt > WINDOW_MS) {
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - record.count);
}
