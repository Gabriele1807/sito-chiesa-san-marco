import { NextResponse } from "next/server";
import { deletePushSubscription } from "@/lib/mongo/push-subscriptions";

/**
 * POST /api/push/unsubscribe — rimuove l'iscrizione di questo browser.
 * Body: { endpoint } (lo conosce solo il browser che si era iscritto).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.endpoint !== "string") {
      return NextResponse.json({ success: false, error: "invalid_endpoint" }, { status: 400 });
    }
    await deletePushSubscription(body.endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
