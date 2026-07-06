/**
 * Rate limiting in memoria per tentativi di login e richieste pubbliche.
 *
 * Dopo 5 tentativi falliti dallo stesso IP in 15 minuti,
 * blocca temporaneamente ulteriori tentativi di login.
 *
 * Dopo 60 richieste dallo stesso IP in 1 minuto,
 * blocca temporaneamente ulteriori richieste generiche.
 *
 * FUTURO: sostituire con Redis o Supabase per ambienti multi-istanza
 * (es. Vercel serverless). Con Redis: usare INCR + EXPIRE per contatore IP.
 */

const MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minuti

const MAX_REQUESTS = 60;
const REQUEST_WINDOW_MS = 60 * 1000; // 1 minuto

interface LoginAttempt {
  count: number;
  firstAttempt: number;
}

interface RequestAttempt {
  count: number;
  firstRequest: number;
}

// Map in memoria: IP → tentativi login
// FUTURO: Redis → INCR login_attempts:{ip} + EXPIRE 900
const attempts = new Map<string, LoginAttempt>();

// Map in memoria: IP → richieste generiche
// FUTURO: Redis → INCR request_attempts:{ip} + EXPIRE 60
const requestAttempts = new Map<string, RequestAttempt>();

/**
 * Verifica se un IP è bloccato per troppi tentativi.
 */
export function isRateLimited(ip: string): boolean {
  const record = attempts.get(ip);
  if (!record) return false;

  // Finestra scaduta: resetta
  if (Date.now() - record.firstAttempt > LOGIN_WINDOW_MS) {
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

  if (!record || Date.now() - record.firstAttempt > LOGIN_WINDOW_MS) {
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

  if (Date.now() - record.firstAttempt > LOGIN_WINDOW_MS) {
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - record.count);
}

/**
 * Verifica se un IP ha superato il limite delle richieste generiche.
 */
export function isIpRateLimited(ip: string): boolean {
  const record = requestAttempts.get(ip);
  if (!record) return false;

  if (Date.now() - record.firstRequest > REQUEST_WINDOW_MS) {
    requestAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_REQUESTS;
}

/**
 * Registra una richiesta pubblica per un IP.
 */
export function recordIpRequest(ip: string): void {
  const record = requestAttempts.get(ip);

  if (!record || Date.now() - record.firstRequest > REQUEST_WINDOW_MS) {
    requestAttempts.set(ip, { count: 1, firstRequest: Date.now() });
  } else {
    record.count++;
  }
}

/**
 * Restituisce il numero di richieste rimaste per un IP.
 */
export function remainingIpRequests(ip: string): number {
  const record = requestAttempts.get(ip);
  if (!record) return MAX_REQUESTS;

  if (Date.now() - record.firstRequest > REQUEST_WINDOW_MS) {
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
