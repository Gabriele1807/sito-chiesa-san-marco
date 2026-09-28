/**
 * Struttura HTML comune delle email della chiesa (conferma iscrizione,
 * promemoria, verifica email). Tabelle e stili inline: sono l'unico modo
 * affidabile di impaginare nei client di posta (Gmail, Outlook, Apple Mail).
 */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Carica i messaggi della lingua indicata (le email non hanno una richiesta HTTP da cui leggerla). */
export async function loadMessages(locale: "it" | "ar") {
  return (await import(`../../../messages/${locale}.json`)).default;
}

export interface EmailDetail {
  label: string;
  value: string;
}

export interface EmailLayoutParams {
  locale: "it" | "ar";
  /** Testo nascosto mostrato come anteprima nella lista dei messaggi. */
  preheader: string;
  title: string;
  /** Paragrafi introduttivi (testo semplice, viene fatto l'escape). */
  paragraphs: string[];
  details?: EmailDetail[];
  button?: { label: string; url: string };
  /** Nota finale in piccolo (testo semplice). */
  footnote?: string;
  signature: string;
}

export function renderEmailLayout(p: EmailLayoutParams): string {
  const dir = p.locale === "ar" ? "rtl" : "ltr";
  const align = dir === "rtl" ? "right" : "left";
  const paragraphs = p.paragraphs
    .map(
      (text) =>
        `<p style="font-size:15px;color:#333;line-height:1.55;margin:0 0 14px;">${escapeHtml(text)}</p>`
    )
    .join("");
  const details = p.details?.length
    ? `<table role="presentation" width="100%" style="margin:8px 0 18px;border-collapse:collapse;background:#fff9f2;border:1px solid #e7d1b8;border-radius:6px;">${p.details
        .map(
          (d) =>
            `<tr><td style="padding:9px 14px;font-size:13px;color:#7a6556;width:34%;vertical-align:top;text-align:${align};">${escapeHtml(d.label)}</td><td style="padding:9px 14px;font-size:14px;color:#231913;text-align:${align};">${escapeHtml(d.value)}</td></tr>`
        )
        .join("")}</table>`
    : "";
  const button = p.button
    ? `<p style="text-align:center;margin:24px 0;"><a href="${escapeHtml(p.button.url)}" style="background:#b45309;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;display:inline-block;">${escapeHtml(p.button.label)}</a></p>`
    : "";
  const footnote = p.footnote
    ? `<p style="font-size:12px;color:#8a7a6e;line-height:1.5;margin:18px 0 0;">${escapeHtml(p.footnote)}</p>`
    : "";

  return `<!doctype html>
<html lang="${p.locale}" dir="${dir}">
  <body style="margin:0;padding:0;background-color:#f7f5f0;font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(p.preheader)}</span>
    <table role="presentation" width="100%" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;padding:32px;text-align:${align};">
            <tr><td>
              <h1 style="font-size:21px;color:#1a1a1a;margin:0 0 18px;">${escapeHtml(p.title)}</h1>
              ${paragraphs}
              ${details}
              ${button}
              ${footnote}
              <p style="font-size:14px;color:#555;margin:24px 0 0;">${escapeHtml(p.signature)}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Versione solo testo (per i client che non mostrano l'HTML e per i filtri antispam). */
export function renderEmailText(p: EmailLayoutParams): string {
  return [
    p.title,
    "",
    ...p.paragraphs.flatMap((text) => [text, ""]),
    ...(p.details ?? []).map((d) => `${d.label}: ${d.value}`),
    ...(p.details?.length ? [""] : []),
    ...(p.button ? [`${p.button.label}: ${p.button.url}`, ""] : []),
    ...(p.footnote ? [p.footnote, ""] : []),
    p.signature,
  ].join("\n");
}

/**
 * Data/ora di un evento come salvata dall'admin ("2026-05-01T10:00", ora
 * italiana senza fuso) → testo leggibile. Letta come ora locale di Milano,
 * senza conversioni di fuso: "10:00" resta "10:00".
 */
export function formatEventDateTime(value: string, locale: "it" | "ar"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return value;
  const [, y, m, d, hh, mm] = match;
  const date = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh ?? 0), Number(mm ?? 0))
  );
  const intlLocale = locale === "ar" ? "ar-EG" : "it-IT";
  const day = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  if (hh === undefined) return day;
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
  return `${day}, ${time}`;
}
