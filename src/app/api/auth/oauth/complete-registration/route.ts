import { NextResponse } from "next/server";
import { verifyOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import {
  findPendingOAuthRegistrationById,
  deletePendingOAuthRegistration,
} from "@/lib/mongo/pending-oauth-registrations";
import { findUserByEmail, createOAuthUser } from "@/lib/mongo/users";
import { createOAuthIdentity } from "@/lib/mongo/oauth-identities";
import { createUserSession } from "@/lib/mongo/sessions";
import type { UserRole, AgeGroup } from "@/types";
import { VALID_ROLES, VALID_AGE_GROUPS } from "@/lib/auth/registration-constants";

function usernameFromEmail(email: string): string {
  const local = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 15) || "utente";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${local}_${suffix}`;
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json().catch(() => ({}));
    const { role, ageGroup, chiesa, email: manualEmail } = body as {
      role?: string;
      ageGroup?: string;
      chiesa?: string;
      email?: string;
    };

    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ success: false, error: "Ruolo non valido" }, { status: 400 });
    }
    if (!ageGroup || !VALID_AGE_GROUPS.includes(ageGroup as AgeGroup)) {
      return NextResponse.json({ success: false, error: "Fascia d'età non valida" }, { status: 400 });
    }

    // L'email del provider è affidabile solo se il provider stesso l'ha
    // dichiarata verificata (es. Google `email_verified`); altrimenti, come
    // un'email inserita manualmente, resta un dato dichiarato e non provato
    // — coerente con la registrazione classica, che non verifica l'email.
    const usingVerifiedProviderEmail = Boolean(pending.providerEmail) && pending.providerEmailVerified === true;
    const email = (pending.providerEmail ?? manualEmail ?? "").toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Email non valida" }, { status: 400 });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email già registrata. Accedi con email e password, poi collega questo provider dal tuo profilo.",
        },
        { status: 409 }
      );
    }

    const user = await createOAuthUser({
      email,
      username: usernameFromEmail(email),
      nome: pending.nome?.trim() || "Utente",
      cognome: pending.cognome?.trim() || "",
      role: role as UserRole,
      ageGroup: ageGroup as AgeGroup,
      chiesa: role === "ospite_chiesa" ? chiesa?.trim() : undefined,
      emailVerificata: usingVerifiedProviderEmail,
    });

    await createOAuthIdentity({
      provider: pending.provider,
      providerAccountId: pending.providerAccountId,
      userId: user._id!,
      accountType: "user",
      providerEmail: pending.providerEmail,
      providerEmailVerified: pending.providerEmailVerified,
    });

    await deletePendingOAuthRegistration(pending._id);

    const { token: sessionToken, expiresAt } = await createUserSession(user._id!, request, false);
    const res = NextResponse.json({ success: true, user }, { status: 201 });
    res.cookies.set("user_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    res.cookies.delete("oauth_pending");
    return res;
  } catch (err) {
    console.error("Errore completamento registrazione OAuth:", err);
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email già registrata. Accedi con email e password, poi collega questo provider dal tuo profilo.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
