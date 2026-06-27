export type PasswordRuleKey =
  | "length"
  | "lowercase"
  | "uppercase"
  | "number"
  | "special";

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
