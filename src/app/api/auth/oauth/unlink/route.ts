import { NextResponse } from "next/server";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { countOAuthIdentitiesByUserId, deleteOAuthIdentity } from "@/lib/mongo/oauth-identities";
import type { OAuthProvider } from "@/lib/mongo/oauth-identities";

const VALID_PROVIDERS: OAuthProvider[] = ["google", "facebook"];

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const session = token ? await validateUserSession(token) : null;
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const provider = (body as { provider?: string }).provider;
  if (!provider || !VALID_PROVIDERS.includes(provider as OAuthProvider)) {
    return NextResponse.json({ success: false, error: "Provider non valido" }, { status: 400 });
  }

  const user = await findUserByIdFull(session.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
  }

  const identityCount = await countOAuthIdentitiesByUserId(session.userId);
  const availableMethods = (user.hasPassword !== false ? 1 : 0) + identityCount;
  if (availableMethods <= 1) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Questo è il tuo unico metodo di accesso. Imposta una password o collega un altro provider prima di scollegarlo.",
      },
      { status: 400 }
    );
  }

  await deleteOAuthIdentity(session.userId, provider as OAuthProvider);
  return NextResponse.json({ success: true });
}
