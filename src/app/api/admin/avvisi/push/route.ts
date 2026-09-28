import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdminSession } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/mongo/audit-log";
import {
  getAvvisoById,
  localizeAvviso,
  markAvvisoPushRun,
  filterActiveAvvisi,
} from "@/lib/mongo/announcements";
import { parseContentId } from "@/lib/admin/content-validation";
import { sendPushToAll, PushNotConfiguredError } from "@/lib/push/send";

const MAX_BODY = 180;

function clip(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

/**
 * POST /api/admin/avvisi/push — invia la notifica push di un avviso a tutti
 * i dispositivi iscritti. Body: { id }. Solo avvisi pubblicati e attivi.
 */
export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  try {
    const body = await request.json();
    const id = parseContentId(body?.id);
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

    const avviso = await getAvvisoById(id);
    if (!avviso) return NextResponse.json({ error: "Avviso non trovato" }, { status: 404 });
    if (filterActiveAvvisi([avviso]).length === 0) {
      return NextResponse.json(
        {
          error:
            "L'avviso non è visibile sul sito (bozza, programmato o scaduto): pubblicalo prima di inviarlo.",
        },
        { status: 400 }
      );
    }

    // `resume`: continua l'ultimo invio rimasto a metà (stesso runId, niente
    // doppioni); altrimenti è un nuovo invio a tutti i dispositivi.
    const resume =
      body?.resume === true && Boolean(avviso.pushRunId) && (avviso.pushRemaining ?? 0) > 0;
    const runId = resume ? avviso.pushRunId! : randomUUID();

    const result = await sendPushToAll(
      (locale) => {
        const text = localizeAvviso(avviso, locale);
        return {
          title: clip(text.titolo, 80),
          body: clip(text.messaggio, MAX_BODY),
          url: "/avvisi",
          tag: `avviso-${avviso.id}`,
          lang: locale,
        };
      },
      { urgent: avviso.livello === "urgente", runId }
    );

    await markAvvisoPushRun(avviso.id, runId, result.remaining);
    await logAdminAction(admin, {
      action: "send",
      entity: "notifiche",
      entityId: avviso.id,
      summary: `Notifica "${clip(avviso.titolo, 80)}"${resume ? " (ripresa)" : ""}: ${result.sent} inviate, ${result.failed} non riuscite${result.remaining ? `, ${result.remaining} da completare` : ""}`,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof PushNotConfiguredError) {
      return NextResponse.json(
        { error: "Notifiche non configurate: mancano le chiavi VAPID nelle variabili d'ambiente." },
        { status: 503 }
      );
    }
    console.error("Errore invio notifica avviso:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Errore durante l'invio" }, { status: 500 });
  }
}
