/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface BookingConfirmationTemplateParams {
  eventName: string;
  eventDate: string;
  locale: "it" | "ar";
}
export async function renderBookingConfirmationEmail(
  _params: BookingConfirmationTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  throw new Error("not implemented");
}
