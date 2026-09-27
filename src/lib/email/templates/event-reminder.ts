import { createTranslator } from "next-intl";
import {
  loadMessages,
  renderEmailLayout,
  renderEmailText,
  type EmailLayoutParams,
  type RenderedEmail,
} from "./layout";
import { eventDetails, type EventEmailData } from "./booking-confirmation";

export interface EventReminderTemplateParams extends EventEmailData {
  /** Pagina dell'evento (assoluta). */
  eventUrl: string;
}

export async function renderEventReminderEmail(
  params: EventReminderTemplateParams
): Promise<RenderedEmail> {
  const messages = await loadMessages(params.locale);
  const t = createTranslator({ locale: params.locale, messages, namespace: "email.eventReminder" });
  const tc = createTranslator({ locale: params.locale, messages, namespace: "email.common" });
  const event = params.eventTitle;

  const layout: EmailLayoutParams = {
    locale: params.locale,
    preheader: t("preheader", { event }),
    title: t("title"),
    paragraphs: [t("intro", { event })],
    details: eventDetails(params, tc),
    button: { label: t("button"), url: params.eventUrl },
    footnote: t("footnote"),
    signature: tc("signature"),
  };

  return {
    subject: t("subject", { event }),
    html: renderEmailLayout(layout),
    text: renderEmailText(layout),
  };
}
