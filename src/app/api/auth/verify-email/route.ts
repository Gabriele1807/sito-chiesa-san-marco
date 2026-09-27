import { NextResponse } from "next/server";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { consumeEmailVerificationToken } from "@/lib/mongo/email-verification-tokens";
import { markEmailVerified } from "@/lib/mongo/users";

/**
 * POST /api/auth/verify-email — conferma l'indirizzo email. Body: { token }.
 * POST (non GET) di proposito: i filtri antispam aprono i link delle email
 * con richieste GET e consumerebbero il token al posto dell'utente; la
 * pagina /verifica-email chiede un clic esplicito.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "rate_limit" }, { status: 429 });
  }
  await recordIpRequest(ip);

  try {
    const body = await request.json();
    const consumed = await consumeEmailVerificationToken(
      typeof body?.token === "string" ? body.token : ""
    );
    if (!consumed) {
      return NextResponse.json({ success: false, error: "invalid_token" }, { status: 400 });
    }
    const verified = await markEmailVerified(consumed.userId, consumed.email);
    if (!verified) {
      // L'utente ha cambiato email dopo l'invio del link: questo link non vale più.
      return NextResponse.json({ success: false, error: "email_changed" }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore POST /api/auth/verify-email:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "server" }, { status: 500 });
  }
}
