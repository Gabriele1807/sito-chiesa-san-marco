import { NextResponse } from "next/server";
import { resolveAccountSession } from "@/lib/oauth/session-resolver";
import { findUserByIdFull } from "@/lib/mongo/users";
import { countOAuthIdentitiesByUserId, deleteOAuthIdentity } from "@/lib/mongo/oauth-identities";
import type { OAuthProvider } from "@/lib/mongo/oauth-identities";
import { applyNoStore } from "@/lib/oauth/http";

const VALID_PROVIDERS: OAuthProvider[] = ["google", "facebook"];

export async function POST(request: Request): Promise<NextResponse> {
  return applyNoStore(await handlePost(request));
}

async function handlePost(request: Request): Promise<NextResponse> {
  const session = await resolveAccountSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const provider = (body as { provider?: string }).provider;
  if (!provider || !VALID_PROVIDERS.includes(provider as OAuthProvider)) {
    return NextResponse.json({ success: false, error: "Provider non valido" }, { status: 400 });
  }

  // Gli admin hanno sempre una password Supabase obbligatoria: non possono
  // mai restare senza alcun metodo di accesso, quindi per loro non serve
  // il controllo "ultimo metodo" (che si applica solo agli utenti normali,
  // dove hasPassword può essere false per account creati solo via provider).
  if (session.accountType === "user") {
    const user = await findUserByIdFull(session.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    const identityCount = await countOAuthIdentitiesByUserId(session.id, "user");
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
  }

  await deleteOAuthIdentity(session.id, provider as OAuthProvider, session.accountType);
  return NextResponse.json({ success: true });
}
