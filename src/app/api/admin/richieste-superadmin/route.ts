import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  getPendingSuperAdminRequests,
  updateSuperAdminRequest,
  findUserById,
} from "@/lib/mongo/users";
import { requireSuperAdminSession } from "@/lib/auth/session";

/**
 * GET /api/admin/richieste-superadmin
 * Lista richieste superadmin pendenti (solo superadmin)
 */
export async function GET() {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
    return NextResponse.json({ success: false, error: "Solo superadmin" }, { status: 403 });
  }

  try {
    const requests = await getPendingSuperAdminRequests();
    return NextResponse.json({ success: true, data: requests });
  } catch (err) {
    console.error("Errore GET richieste superadmin:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}

/**
 * POST /api/admin/richieste-superadmin
 * Body: { userId, action: "approve" | "reject" }
 */
export async function POST(request: Request) {
  const adminUser = await requireSuperAdminSession();
  if (!adminUser || !isSuperAdmin(adminUser.ruolo)) {
    return NextResponse.json({ success: false, error: "Solo superadmin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "userId e action validi richiesti" },
        { status: 400 }
      );
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
    }

    if (action === "reject") {
      await updateSuperAdminRequest(userId, "rejected");
      return NextResponse.json({ success: true, message: "Richiesta superadmin rifiutata" });
    }

    // approve
    const { data: updatedAdmin, error } = await supabaseAdmin
      .from("admin_users")
      .update({ ruolo: "superadmin" })
      .eq("username", user.username)
      .eq("attivo", true)
      .select("id")
      .single();

    if (error || !updatedAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin non trovato o non attivo" },
        { status: 404 }
      );
    }

    await updateSuperAdminRequest(userId, "approved");

    return NextResponse.json({
      success: true,
      message: `Utente ${user.username} promosso a superadmin.`,
    });
  } catch (err) {
    console.error("Errore POST richieste superadmin:", err);
    return NextResponse.json({ success: false, error: "Errore del server" }, { status: 500 });
  }
}
