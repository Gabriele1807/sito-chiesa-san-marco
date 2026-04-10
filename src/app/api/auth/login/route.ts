import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, cleanExpiredSessions } from "@/lib/auth/session";
import { findUserByEmail, findUserByUsername, updateUserLastAccess } from "@/lib/mongo/users";
import { createUserSession, cleanExpiredUserSessions } from "@/lib/mongo/sessions";
import {
  isRateLimited,
  recordFailedAttempt,
  resetAttempts,
  remainingAttempts,
} from "@/lib/auth/rate-limit";

/**
 * Login unificato: tenta prima Supabase (admin), poi MongoDB (utente normale).
 * Campo identificativo: 'identifier' (può essere username o email).
 */
export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Troppi tentativi. Riprova tra 15 minuti." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identifier, password, rememberMe } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Credenziali obbligatorie" },
        { status: 400 }
      );
    }

    const id = String(identifier).trim();
    const pwd = String(password);

    // === TENTATIVO 1: Admin su Supabase (username match) ===
    const adminResult = await tryAdminLogin(id, pwd, request, rememberMe === true);
    if (adminResult) {
      resetAttempts(ip);
      cleanExpiredSessions().catch(() => {});
      return adminResult;
    }

    // === TENTATIVO 2: Utente normale su MongoDB (email o username) ===
    const userResult = await tryUserLogin(id, pwd, request, rememberMe === true);
    if (userResult) {
      resetAttempts(ip);
      cleanExpiredUserSessions().catch(() => {});
      return userResult;
    }

    // === Nessun match ===
    recordFailedAttempt(ip);
    const remaining = remainingAttempts(ip);
    return NextResponse.json(
      { success: false, error: "Credenziali non valide", remaining },
      { status: 401 }
    );
  } catch (err) {
    console.error("Errore login unificato:", err);
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}

// --------------- Admin login (Supabase) ---------------

async function tryAdminLogin(
  identifier: string,
  password: string,
  request: Request,
  rememberMe: boolean
): Promise<NextResponse | null> {
  // Cerchiamo sia per username che per email
  const { data: user, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, email, password_hash, nome, cognome, ruolo, attivo")
    .or(`username.eq.${identifier},email.eq.${identifier}`)
    .single();

  if (dbError || !user) return null;
  if (!user.attivo) {
    return NextResponse.json(
      { success: false, error: "Account admin disattivato. Contatta il superadmin." },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  // Login admin riuscito
  await supabaseAdmin
    .from("admin_users")
    .update({ ultimo_accesso: new Date().toISOString() })
    .eq("id", user.id);

  const { token, expiresAt } = await createSession(user.id, request, rememberMe);

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.json({
    success: true,
    type: "admin",
    user: {
      id: user.id,
      username: user.username,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      isAdmin: true,
    },
  });
}

// --------------- User login (MongoDB) ---------------

async function tryUserLogin(
  identifier: string,
  password: string,
  request: Request,
  rememberMe: boolean
): Promise<NextResponse | null> {
  // Cerchiamo sia per email che per username
  const isEmail = identifier.includes("@");
  const user = isEmail
    ? await findUserByEmail(identifier.toLowerCase())
    : await findUserByUsername(identifier);

  if (!user) return null;
  if (!user.attivo) {
    return NextResponse.json(
      { success: false, error: "Account disattivato." },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Login utente riuscito
  await updateUserLastAccess(user._id);

  const { token, expiresAt } = await createUserSession(user._id, request, rememberMe);

  const cookieStore = await cookies();
  cookieStore.set("user_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.json({
    success: true,
    type: "user",
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      nome: user.nome,
      cognome: user.cognome,
      role: user.role,
      ageGroup: user.ageGroup,
      isAdmin: false,
    },
  });
}
