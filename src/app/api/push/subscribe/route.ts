import { NextResponse } from "next/server";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { consumeActionLimit, LIMITS } from "@/lib/auth/action-limit";
import { getVapidConfig } from "@/lib/push/config";
import {
  parsePushSubscription,
  savePushSubscription,
  deletePushSubscription,
} from "@/lib/mongo/push-subscriptions";

/**
 * POST /api/push/subscribe — registra il browser per le notifiche degli avvisi.
 * Body: { subscription: PushSubscriptionJSON, locale?: "it" | "ar", previousEndpoint?: string }
 * Nessun login richiesto: l'iscrizione riguarda il dispositivo, non l'account.
 */
export async function POST(request: Request) {
  if (!getVapidConfig()) {
    return NextResponse.json({ success: false, error: "not_configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
  }
  await recordIpRequest(ip);

  try {
    const body = await request.json();
    const cookieLocale = /(?:^|;\s*)locale=ar(?:;|$)/.test(request.headers.get("cookie") ?? "")
      ? "ar"
      : "it";
    const record = parsePushSubscription(body?.subscription, body?.locale ?? cookieLocale);
    if (!record) {
      return NextResponse.json({ success: false, error: "invalid_subscription" }, { status: 400 });
    }

    if (!(await consumeActionLimit(LIMITS.pushSubscribe, ip)).allowed) {
      return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
    }

    await savePushSubscription(record);
    // Rinnovo dal service worker (pushsubscriptionchange): la vecchia non serve più.
    if (typeof body?.previousEndpoint === "string" && body.previousEndpoint !== record.endpoint) {
      await deletePushSubscription(body.previousEndpoint);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/push/subscribe:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
