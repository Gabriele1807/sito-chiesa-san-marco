import { NextResponse } from "next/server";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import { findPendingOAuthRegistrationById } from "@/lib/mongo/pending-oauth-registrations";
import { applyNoStore } from "@/lib/oauth/http";

export async function GET(request: Request): Promise<NextResponse> {
  return applyNoStore(await handleGet(request));
}

async function handleGet(request: Request): Promise<NextResponse> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)oauth_pending=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const parsed = token ? await verifyOAuthPendingCookie(token) : null;
  if (!parsed) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  const pending = await findPendingOAuthRegistrationById(parsed.pendingId);
  if (!pending) {
    return NextResponse.json({ success: false, error: "Sessione OAuth scaduta" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    pending: {
      provider: pending.provider,
      nome: pending.nome,
      cognome: pending.cognome,
      providerEmail: pending.providerEmail,
      providerEmailVerified: pending.providerEmailVerified,
    },
  });
}
