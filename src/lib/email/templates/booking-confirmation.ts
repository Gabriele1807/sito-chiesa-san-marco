import { createTranslator } from "next-intl";
import {
  loadMessages,
  renderEmailLayout,
  renderEmailText,
  formatEventDateTime,
  type EmailDetail,
  type EmailLayoutParams,
  type RenderedEmail,
} from "./layout";

export interface EventEmailData {
  locale: "it" | "ar";
  eventTitle: string;
  /** Data dell'evento come salvata ("2026-05-01T10:00", ora italiana). */
  eventDate: string;
  luogo?: string;
  /** Nomi delle persone iscritte (una sola, o i membri della famiglia). */
  partecipanti: string[];
  raccolta?: string;
  paymentDeadline?: string;
}

/** Righe di riepilogo comuni a conferma e promemoria. */
export function eventDetails(
  data: EventEmailData,
  t: (
    key:
      | "labelEvento"
      | "labelData"
      | "labelLuogo"
      | "labelPartecipanti"
      | "labelRaccolta"
      | "labelPagamento"
  ) => string
): EmailDetail[] {
  const details: EmailDetail[] = [
    { label: t("labelEvento"), value: data.eventTitle },
    { label: t("labelData"), value: formatEventDateTime(data.eventDate, data.locale) },
  ];
  if (data.luogo) details.push({ label: t("labelLuogo"), value: data.luogo });
  if (data.partecipanti.length)
    details.push({ label: t("labelPartecipanti"), value: data.partecipanti.join(", ") });
  if (data.raccolta) details.push({ label: t("labelRaccolta"), value: data.raccolta });
  if (data.paymentDeadline) {
    details.push({
      label: t("labelPagamento"),
      value: formatEventDateTime(data.paymentDeadline, data.locale),
    });
  }
  return details;
}

export interface BookingConfirmationTemplateParams extends EventEmailData {
  /** Pagina "Le mie iscrizioni" (assoluta). */
  manageUrl: string;
}

export async function renderBookingConfirmationEmail(
  params: BookingConfirmationTemplateParams
): Promise<RenderedEmail> {
  const messages = await loadMessages(params.locale);
  const t = createTranslator({
    locale: params.locale,
    messages,
    namespace: "email.bookingConfirmation",
  });
  const tc = createTranslator({ locale: params.locale, messages, namespace: "email.common" });
  const event = params.eventTitle;

  const layout: EmailLayoutParams = {
    locale: params.locale,
    preheader: t("preheader", { event }),
    title: t("title"),
    paragraphs: [t("intro", { event })],
    details: eventDetails(params, tc),
    button: { label: t("button"), url: params.manageUrl },
    footnote: `${t("reminderNote")} ${t("footnote")}`,
    signature: tc("signature"),
  };

  return {
    subject: t("subject", { event }),
    html: renderEmailLayout(layout),
    text: renderEmailText(layout),
  };
}
