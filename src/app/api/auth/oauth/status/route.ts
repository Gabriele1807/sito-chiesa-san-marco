import { NextResponse } from "next/server";
import { validateUserSession } from "@/lib/mongo/sessions";
import { findUserByIdFull } from "@/lib/mongo/users";
import { findOAuthIdentitiesByUserId } from "@/lib/mongo/oauth-identities";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)user_session=([^;]+)/);
  const token = match?.[1] ? decodeURIComponent(match[1]) : "";
  const session = token ? await validateUserSession(token) : null;
  if (!session) {
    return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
  }

  const [user, identities] = await Promise.all([
    findUserByIdFull(session.userId),
    findOAuthIdentitiesByUserId(session.userId),
  ]);

  return NextResponse.json({
    success: true,
    hasPassword: user?.hasPassword !== false,
    identities: identities.map((i) => ({
      provider: i.provider,
      linkedAt: i.linkedAt,
      providerEmail: i.providerEmail,
    })),
  });
}
