/**
 * Utility per hashing e verifica password con bcryptjs.
 * Salt rounds: 12 (buon compromesso sicurezza/performance).
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Genera un hash bcrypt dalla password in chiaro.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se una password in chiaro corrisponde a un hash bcrypt.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
