import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { listAuditLog, getAuditFilterOptions } from "@/lib/mongo/audit-log";

/**
 * GET /api/admin/registro — registro attività admin (solo superadmin).
 * Query: page, limit, entity, action, admin, from, to (YYYY-MM-DD).
 */
export async function GET(request: Request) {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser) {
    return NextResponse.json({ success: false, error: "Permessi insufficienti" }, { status: 403 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const [result, options] = await Promise.all([
      listAuditLog({
        page: Number(params.get("page") ?? "1"),
        limit: Number(params.get("limit") ?? "50"),
        entity: params.get("entity") ?? undefined,
        action: params.get("action") ?? undefined,
        adminUsername: params.get("admin") ?? undefined,
        from: params.get("from") ?? undefined,
        to: params.get("to") ?? undefined,
      }),
      getAuditFilterOptions(),
    ]);
    return NextResponse.json({ success: true, ...result, options });
  } catch (err) {
    console.error("Errore GET registro attività:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
