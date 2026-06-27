import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSession } from "@/lib/auth/session";

const SESSION_COOKIE = "admin_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Non proteggere la pagina di login e l'API di login
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Proteggi tutte le rotte /admin/* e /api/admin/*
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return redirectToLogin(request);
    }

    try {
      const user = await validateSession(token);
      if (!user || !user.attivo) {
        return redirectToLogin(request, true);
      }

      // Sessione valida → aggiungi header per le pagine admin
      const response = NextResponse.next();
      response.headers.set("x-admin-user-id", user.id);
      response.headers.set("x-admin-ruolo", user.ruolo);
      response.headers.set("x-admin-username", user.username);
      return response;
    } catch (err) {
      console.error("Middleware auth error:", err);
      return redirectToLogin(request, true);
    }
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, expired = false) {
  // Per API routes, ritorna 401 JSON
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: "Non autenticato" },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (expired) {
    loginUrl.searchParams.set("session", "expired");
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
