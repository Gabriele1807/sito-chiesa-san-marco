import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteUserSession } from "@/lib/mongo/sessions";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_session")?.value;

    if (token) {
      await deleteUserSession(token);
    }

    cookieStore.delete("user_session");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Errore logout utente:", err);
    // Elimina comunque il cookie anche in caso di errore DB
    const cookieStore = await cookies();
    cookieStore.delete("user_session");
    return NextResponse.json({ success: true });
  }
}
