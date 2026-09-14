import { NextResponse } from "next/server";
import { resolveAccountSession } from "@/lib/oauth/session-resolver";
import { findUserByIdFull } from "@/lib/mongo/users";
import { findOAuthIdentitiesByUserId } from "@/lib/mongo/oauth-identities";

export async function GET(request: Request) {
  const session = await resolveAccountSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const identities = await findOAuthIdentitiesByUserId(session.id, session.accountType);

  // Gli admin hanno sempre una password Supabase obbligatoria: hasPassword
  // è sempre true per loro, non esiste un account admin senza password.
  const hasPassword =
    session.accountType === "admin"
      ? true
      : (await findUserByIdFull(session.id))?.hasPassword !== false;

  return NextResponse.json({
    success: true,
    hasPassword,
    identities: identities.map((i) => ({
      provider: i.provider,
      linkedAt: i.linkedAt,
      providerEmail: i.providerEmail,
    })),
  });
}
