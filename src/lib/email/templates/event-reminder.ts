/** Stub: firma tipizzata, nessun invio reale in questa fase (design spec §7, §11). */
export interface EventReminderTemplateParams {
  eventName: string;
  eventDate: string;
  locale: "it" | "ar";
}
export async function renderEventReminderEmail(
  _params: EventReminderTemplateParams
): Promise<{ subject: string; html: string; text: string }> {
  void _params;
  throw new Error("not implemented");
}
