/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface NewsletterTemplateParams {
  title: string;
  bodyHtml: string;
  locale: "it" | "ar";
}
export async function renderNewsletterEmail(
  _params: NewsletterTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  void _params;
  throw new Error("not implemented");
}
