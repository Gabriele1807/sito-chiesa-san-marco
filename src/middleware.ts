import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { getRedis } from "@/lib/redis/client";

/**
 * Safety net for every route under /api/admin/*: rejects requests with no
 * valid, non-revoked admin session before the route handler runs.
 *
 * This does NOT replace the requireAdminSession()/requireSuperAdminSession()
 * checks already present in each route handler (see PROJECT_CONTEXT.md
 * §6.4.1) — those still run and still enforce role-specific access
 * (superadmin-only routes, etc.). This middleware only closes the gap where
 * a *future* admin route gets added without copying that per-route
 * boilerplate: even then, an unauthenticated request never reaches the
 * handler. It's deliberately additive, not a replacement, to avoid
 * regressing existing per-route behavior in this pass.
 *
 * Known limitation: revocation (logout) is only enforced here when Redis is
 * configured (see src/lib/redis/client.ts) — the in-memory revocation Set in
 * session.ts lives in a different process/runtime than this Edge middleware,
 * so without Redis a just-logged-out token can still pass this check until
 * the corresponding route handler's own requireAdminSession() call — which
 * does share that in-memory Set at least within the same instance — or
 * until the token naturally expires.
 */

const PUBLIC_ADMIN_PATHS = ["/api/admin/login", "/api/admin/logout"];

export async function middleware(request: NextRequest) {
  if (PUBLIC_ADMIN_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  if (!token) {
    return unauthorized();
  }

  const payload = await verifyJwt<{ sub: string; sessionType?: string; attivo?: boolean }>(token);
  if (!payload || payload.sessionType !== "admin" || payload.attivo === false) {
    return unauthorized();
  }

  const redis = getRedis();
  if (redis) {
    const revoked = await redis.get(`admin_revoked:${token}`);
    if (revoked !== null) {
      return unauthorized();
    }
  }

  return NextResponse.next();
}

function unauthorized() {
  return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 });
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
