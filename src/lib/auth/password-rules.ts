export type PasswordRuleKey = "length" | "lowercase" | "uppercase" | "number" | "special";

export interface PasswordRuleState {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export function validatePasswordRules(password: string): PasswordRuleState {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const rules = validatePasswordRules(password);
  return Object.values(rules).every(Boolean);
}

export const PASSWORD_POLICY_ERROR =
  "La password deve avere 8-128 caratteri e contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale";

/** Stessa policy per utenti e amministratori, da usare lato server: null se valida. */
export function passwordPolicyError(password: unknown): string | null {
  if (typeof password !== "string" || password.length > 128) return PASSWORD_POLICY_ERROR;
  return isPasswordStrong(password) ? null : PASSWORD_POLICY_ERROR;
}
