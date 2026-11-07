/**
 * Utilità comuni alle API admin del calendario: riusano la sessione admin
 * esistente (requireAdminSession) e il sistema di permessi per ruolo.
 * Il proxy (src/proxy.ts) blocca comunque ogni /api/admin/* senza sessione.
 */

import { NextResponse } from "next/server";
import { requireAdminSession, type AdminUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { logAdminAction, type AuditAction } from "@/lib/mongo/audit-log";
import { revalidatePublicContent } from "@/lib/cache/content-revalidate";

export async function requireCalendarioAdmin(
  permission: Extract<Permission, "calendario.read" | "calendario.write">
): Promise<AdminUser | null> {
  const admin = await requireAdminSession();
  if (!admin || !hasPermission(admin.ruolo, permission)) return null;
  return admin;
}

export function unauthorized() {
  return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

/** Legge il body JSON; `undefined` se non è JSON valido. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Dopo una scrittura: invalida la cache pubblica e registra l'azione. */
export async function afterWrite(
  admin: AdminUser,
  action: AuditAction,
  entityId: string,
  summary: string
) {
  revalidatePublicContent("calendario");
  await logAdminAction(admin, { action, entity: "calendario", entityId, summary });
}
