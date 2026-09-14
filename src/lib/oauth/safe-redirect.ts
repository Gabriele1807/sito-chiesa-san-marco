/**
 * Consente solo percorsi relativi interni come destinazione di redirect nel
 * flusso OAuth (`returnTo`) — mai un URL assoluto o protocol-relative.
 *
 * `new URL(returnTo, base)` ignora `base` quando `returnTo` è già un URL
 * assoluto (es. "https://evil.example" o "//evil.example"): senza questo
 * controllo, un `returnTo` malevolo in `/api/auth/oauth/<provider>/start`
 * produrrebbe un redirect verso un host esterno dopo un login OAuth
 * altrimenti legittimo (open redirect / vettore di phishing).
 */
export function sanitizeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  // Deve iniziare con esattamente uno slash (non due, non uno slash seguito
  // da backslash) e non contenere spazi/whitespace — blocca sia URL assoluti
  // ("https://…") sia percorsi protocol-relative ("//evil.example",
  // "/\evil.example", quest'ultimo interpretato da alcuni browser come "//").
  if (!/^\/(?!\/|\\)\S*$/.test(value)) return fallback;
  return value;
}
