import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth/session";
import { recordAdminAction } from "@/lib/mongo/audit-log";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    // Registrata prima della revoca, finché la sessione è ancora valida.
    await recordAdminAction({ action: "logout", entity: "accesso", summary: "Uscita dal pannello admin" });

    // Elimina sessione dal DB
    if (token) {
      await deleteSession(token);
    }

    // Elimina cookie
    cookieStore.delete("admin_session");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore logout:", err);
    // Elimina comunque il cookie anche in caso di errore DB
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true });
  }
}
