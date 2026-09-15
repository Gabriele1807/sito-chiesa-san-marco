import { createTranslator } from "next-intl";

export interface ResetPasswordTemplateParams {
  resetUrl: string;
  locale: "it" | "ar";
  expirationMinutes: number;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Carica direttamente il file dei messaggi per la lingua richiesta e usa
 * createTranslator (da "next-intl", non "next-intl/server"): a differenza
 * di getTranslations, non dipende dal contesto della request corrente
 * (getRequestConfig chiama cookies(), che qui non è disponibile — l'email
 * va inviata nella lingua salvata dell'utente, non in quella del cookie
 * della richiesta che ha innescato l'invio).
 */
export async function renderResetPasswordEmail(
  params: ResetPasswordTemplateParams
): Promise<RenderedEmail> {
  const messages = (await import(`../../../messages/${params.locale}.json`)).default;
  const t = createTranslator({
    locale: params.locale,
    messages,
    namespace: "email.resetPassword",
  });
  const dir = params.locale === "ar" ? "rtl" : "ltr";

  const subject = t("subject");
  const expiry = t("expiry", { minutes: params.expirationMinutes });

  const html = `<!doctype html>
<html lang="${params.locale}" dir="${dir}">
  <body style="margin:0;padding:0;background-color:#f7f5f0;font-family:Georgia,serif;">
    <table role="presentation" width="100%" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" style="background:#ffffff;border-radius:8px;padding:32px;text-align:${dir === "rtl" ? "right" : "left"};">
            <tr><td>
              <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 16px;">${t("title")}</h1>
              <p style="font-size:15px;color:#333;line-height:1.5;">${t("intro")}</p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${params.resetUrl}" style="background:#b8860b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;">${t("button")}</a>
              </p>
              <p style="font-size:13px;color:#666;">${t("altLinkLabel")}</p>
              <p style="font-size:13px;color:#b8860b;word-break:break-all;">${params.resetUrl}</p>
              <p style="font-size:13px;color:#666;">${expiry}</p>
              <p style="font-size:13px;color:#999;margin-top:24px;">${t("ignore")}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${t("title")}\n\n${t("intro")}\n\n${params.resetUrl}\n\n${expiry}\n\n${t("ignore")}`;

  return { subject, html, text };
}
