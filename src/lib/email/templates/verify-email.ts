import { createTranslator } from "next-intl";
import {
  loadMessages,
  renderEmailLayout,
  renderEmailText,
  type EmailLayoutParams,
  type RenderedEmail,
} from "./layout";

export interface VerifyEmailTemplateParams {
  verifyUrl: string;
  locale: "it" | "ar";
  expirationHours: number;
}

export async function renderVerifyEmail(params: VerifyEmailTemplateParams): Promise<RenderedEmail> {
  const messages = await loadMessages(params.locale);
  const t = createTranslator({ locale: params.locale, messages, namespace: "email.verifyEmail" });
  const tc = createTranslator({ locale: params.locale, messages, namespace: "email.common" });

  const layout: EmailLayoutParams = {
    locale: params.locale,
    preheader: t("preheader"),
    title: t("title"),
    paragraphs: [t("intro")],
    button: { label: t("button"), url: params.verifyUrl },
    footnote: `${t("expiry", { hours: params.expirationHours, url: params.verifyUrl })} ${t("ignore")}`,
    signature: tc("signature"),
  };

  return { subject: t("subject"), html: renderEmailLayout(layout), text: renderEmailText(layout) };
}
