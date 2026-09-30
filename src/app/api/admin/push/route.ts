import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { checkVapidConfig } from "@/lib/push/config";
import { countPushSubscriptions } from "@/lib/mongo/push-subscriptions";

/** GET /api/admin/push — stato delle notifiche: configurate? quanti dispositivi iscritti? */
export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  // `problems` descrive cosa manca o è scritto male, mai i valori delle variabili.
  const { config, problems } = checkVapidConfig();
  const configured = config !== null;
  const subscribers = configured ? await countPushSubscriptions() : { total: 0, it: 0, ar: 0 };
  return NextResponse.json({ configured, problems, subscribers });
}
