// src/app/api/auth/oauth/[provider]/start/route.ts
import { NextResponse } from "next/server";
import { generateState, generateCodeVerifier } from "arctic";
import { getProviderAdapter, SUPPORTED_PROVIDERS, type SupportedProvider } from "@/lib/oauth/providers";
import { signOAuthFlowCookie, hashSessionToken, type OAuthIntent } from "@/lib/oauth/flow-cookie";
import { getClientIp, isIpRateLimited, recordIpRequest } from "@/lib/auth/rate-limit";
import { sanitizeReturnTo } from "@/lib/oauth/safe-redirect";
import { applyNoStore } from "@/lib/oauth/http";
import {
  readSessionCookie,
  resolveAdminSessionToken,
  resolveUserSessionToken,
} from "@/lib/oauth/session-resolver";

function isSupportedProvider(value: string): value is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  return applyNoStore(await handleGet(request, context));
}

async function handleGet(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await params;
  if (!isSupportedProvider(provider)) {
    return NextResponse.json({ success: false, error: "Provider non supportato" }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (await isIpRateLimited(ip)) {
    return NextResponse.json({ success: false, error: "Troppe richieste" }, { status: 429 });
  }
  await recordIpRequest(ip);

  const adapter = getProviderAdapter(provider);
  if (!adapter) {
    return NextResponse.json(
      { success: false, error: "Provider non configurato" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const intentParam = url.searchParams.get("intent");
  const intent: OAuthIntent =
    intentParam === "link" || intentParam === "register" ? intentParam : "login";
  const returnTo = sanitizeReturnTo(
    url.searchParams.get("returnTo"),
    intent === "link" ? "/profilo" : "/"
  );

  let linkedSessionHash: string | undefined;
  let linkedAccountType: "user" | "admin" | undefined;
  if (intent === "link") {
    const adminToken = readSessionCookie(request, "admin");
    const adminSession = adminToken ? await resolveAdminSessionToken(adminToken) : null;

    if (adminSession) {
      linkedAccountType = "admin";
      linkedSessionHash = await hashSessionToken(adminToken!);
    } else {
      const userToken = readSessionCookie(request, "user");
      const userSession = userToken ? await resolveUserSessionToken(userToken) : null;
      if (!userSession) {
        return NextResponse.json({ success: false, error: "Sessione richiesta" }, { status: 401 });
      }
      linkedAccountType = "user";
      linkedSessionHash = await hashSessionToken(userToken!);
    }
  }

  const state = generateState();
  const codeVerifier = adapter.usesPkce ? generateCodeVerifier() : undefined;
  const authUrl = adapter.createAuthorizationURL(state, codeVerifier);

  const flowCookie = await signOAuthFlowCookie({
    state,
    provider,
    intent,
    returnTo,
    codeVerifier,
    linkedSessionHash,
    linkedAccountType,
  });

  const response = NextResponse.redirect(authUrl, { status: 307 });
  response.cookies.set("oauth_flow", flowCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
