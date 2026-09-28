import { NextResponse } from "next/server";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { consumeActionLimit, LIMITS } from "@/lib/auth/action-limit";
import { validatePrayerRequest, createPrayerRequest } from "@/lib/mongo/prayer-requests";

/**
 * POST /api/richieste-preghiera — invio pubblico di un'intenzione di preghiera.
 * Nessun login richiesto. Protezioni anti-spam: rate limit per IP e campo
 * trappola `website` (invisibile alle persone, compilato dai bot).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "rate_limit" }, { status: 429 });
  }
  await recordIpRequest(ip);

  try {
    const body = await request.json();

    // Bot: risposta di successo identica, nessun salvataggio.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const parsed = validatePrayerRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    if (!(await consumeActionLimit(LIMITS.prayerRequest, ip)).allowed) {
      return NextResponse.json({ success: false, error: "rate_limit" }, { status: 429 });
    }

    const locale = /(?:^|;\s*)locale=ar(?:;|$)/.test(request.headers.get("cookie") ?? "")
      ? "ar"
      : "it";
    await createPrayerRequest(parsed.data, locale);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Errore POST richiesta di preghiera:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "server" }, { status: 500 });
  }
}
