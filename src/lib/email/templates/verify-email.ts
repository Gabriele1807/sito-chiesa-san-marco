/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7). */
export interface VerifyEmailTemplateParams {
  verifyUrl: string;
  locale: "it" | "ar";
}
export async function renderVerifyEmail(
  _params: VerifyEmailTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  void _params;
  throw new Error("not implemented");
}
