import { NextResponse } from "next/server";
import { getProviderAdapter, SUPPORTED_PROVIDERS, type SupportedProvider } from "@/lib/oauth/providers";
import { verifyOAuthFlowCookie, hashSessionToken, signOAuthPendingCookie } from "@/lib/oauth/flow-cookie";
import { sanitizeReturnTo } from "@/lib/oauth/safe-redirect";
import {
  readSessionCookie,
  resolveAdminSessionToken,
  resolveUserSessionToken,
} from "@/lib/oauth/session-resolver";
import {
  findOAuthIdentity,
  createOAuthIdentity,
  deleteOAuthIdentityById,
  touchOAuthIdentityLogin,
  type OAuthAccountType,
} from "@/lib/mongo/oauth-identities";
import { createPendingOAuthRegistration } from "@/lib/mongo/pending-oauth-registrations";
import { findUserById, updateUserLastAccess } from "@/lib/mongo/users";
import { createUserSession } from "@/lib/mongo/sessions";
import { createSession as createAdminSession, getAdminUserById, adminUserExists } from "@/lib/auth/session";

function isSupportedProvider(value: string): value is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

function errorRedirect(base: string, returnTo: string, code: string) {
  const url = new URL(sanitizeReturnTo(returnTo, "/"), base);
  url.searchParams.set("oauthError", code);
  const res = NextResponse.redirect(url, { status: 307 });
  res.cookies.delete("oauth_flow");
  return res;
}

function successRedirect(base: string, returnTo: string, params: Record<string, string>) {
  const url = new URL(sanitizeReturnTo(returnTo, "/"), base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = NextResponse.redirect(url, { status: 307 });
  res.cookies.delete("oauth_flow");
  return res;
}

/**
 * Un'identità collegata il cui proprietario non esiste più (utente/admin
 * eliminato) è un'identità orfana: va cancellata prima di essere trattata
 * come "già collegata", altrimenti bloccherebbe per sempre sia un nuovo
 * collegamento sia un nuovo tentativo di accesso con quel provider.
 * Per gli admin l'esistenza è verificata ignorando `attivo` (un admin
 * disattivato non è "eliminato": la sua identità va preservata, solo il
 * login resta bloccato altrove da quel controllo).
 */
async function purgeIfOrphaned<T extends { _id: string; userId: string; accountType: OAuthAccountType }>(
  identity: T | null
): Promise<T | null> {
  if (!identity) return null;
  const ownerExists =
    identity.accountType === "admin"
      ? await adminUserExists(identity.userId)
      : Boolean(await findUserById(identity.userId));
  if (ownerExists) return identity;
  await deleteOAuthIdentityById(identity._id);
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (!isSupportedProvider(provider)) {
    return errorRedirect(siteBase, "/", "unsupported_provider");
  }

  const url = new URL(request.url);
  const queryState = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  const cookieHeader = request.headers.get("cookie") ?? "";
  const flowMatch = cookieHeader.match(/(?:^|;\s*)oauth_flow=([^;]+)/);
  const flowToken = flowMatch?.[1] ? decodeURIComponent(flowMatch[1]) : "";
  const flow = flowToken ? await verifyOAuthFlowCookie(flowToken) : null;

  if (!flow || flow.provider !== provider) {
    return errorRedirect(siteBase, "/", "invalid_state");
  }
  if (!queryState || queryState !== flow.state) {
    return errorRedirect(siteBase, flow.returnTo, "invalid_state");
  }
  if (!code) {
    // L'utente ha annullato o il provider non ha restituito un code.
    return errorRedirect(siteBase, flow.returnTo, "access_denied");
  }

  const adapter = getProviderAdapter(provider);
  if (!adapter) {
    return errorRedirect(siteBase, flow.returnTo, "provider_unavailable");
  }

  let profile;
  try {
    profile = await adapter.validateCallback(code, flow.codeVerifier);
  } catch {
    return errorRedirect(siteBase, flow.returnTo, "provider_error");
  }

  const existing = await purgeIfOrphaned(await findOAuthIdentity(provider, profile.providerAccountId));

  // --- intent = link ---
  if (flow.intent === "link") {
    const accountType: OAuthAccountType = flow.linkedAccountType === "admin" ? "admin" : "user";
    const sessionToken = readSessionCookie(request, accountType);
    const currentHash = sessionToken ? await hashSessionToken(sessionToken) : "";
    if (!sessionToken || currentHash !== flow.linkedSessionHash) {
      return errorRedirect(siteBase, "/profilo", "session_expired");
    }
    const resolved =
      accountType === "admin"
        ? await resolveAdminSessionToken(sessionToken)
        : await resolveUserSessionToken(sessionToken);
    if (!resolved) {
      return errorRedirect(siteBase, "/profilo", "session_expired");
    }
    if (existing) {
      const sameUser = existing.userId === resolved.id && existing.accountType === accountType;
      return errorRedirect(siteBase, "/profilo", sameUser ? "already_linked" : "identity_taken");
    }
    await createOAuthIdentity({
      provider,
      providerAccountId: profile.providerAccountId,
      userId: resolved.id,
      accountType,
      providerEmail: profile.email,
      providerEmailVerified: profile.emailVerified,
    });
    return successRedirect(siteBase, "/profilo", { linked: provider });
  }

  // --- intent = login | register, identity already linked ---
  if (existing) {
    if (existing.accountType === "admin") {
      const adminUser = await getAdminUserById(existing.userId);
      if (!adminUser || !adminUser.attivo) {
        return errorRedirect(siteBase, flow.returnTo, "account_disabled");
      }
      await touchOAuthIdentityLogin(provider, profile.providerAccountId);
      const { token, expiresAt } = await createAdminSession(existing.userId, request, false);
      const res = successRedirect(siteBase, flow.returnTo, {});
      res.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });
      return res;
    }

    const user = await findUserById(existing.userId);
    if (!user || !user.attivo) {
      return errorRedirect(siteBase, flow.returnTo, "account_disabled");
    }
    await touchOAuthIdentityLogin(provider, profile.providerAccountId);
    await updateUserLastAccess(existing.userId);
    const { token, expiresAt } = await createUserSession(existing.userId, request, false);
    const res = successRedirect(siteBase, flow.returnTo, {});
    res.cookies.set("user_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return res;
  }

  // --- intent = login | register, brand-new identity: provisional registration ---
  const pending = await createPendingOAuthRegistration({
    provider,
    providerAccountId: profile.providerAccountId,
    providerEmail: profile.email,
    providerEmailVerified: profile.emailVerified,
    nome: profile.givenName,
    cognome: profile.familyName,
    pictureUrl: profile.pictureUrl,
  });
  const pendingCookie = await signOAuthPendingCookie(pending._id);
  const res = successRedirect(siteBase, "/", { completeRegistration: "1" });
  res.cookies.set("oauth_pending", pendingCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return res;
}
