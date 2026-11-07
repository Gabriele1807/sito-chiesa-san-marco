import { NextResponse } from "next/server";
import {
  afterWrite,
  badRequest,
  readJson,
  requireCalendarioAdmin,
  unauthorized,
} from "@/lib/admin/calendario-route";
import {
  ensureCalendarioSeeded,
  listRegole,
  setRegola,
  validateRegola,
} from "@/lib/mongo/calendario";

export async function GET() {
  if (!(await requireCalendarioAdmin("calendario.read"))) return unauthorized();
  try {
    await ensureCalendarioSeeded();
    return NextResponse.json(await listRegole());
  } catch {
    return NextResponse.json({ error: "Database non raggiungibile" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const parsed = validateRegola(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  try {
    const regola = await setRegola(parsed.data, admin.username);
    await afterWrite(
      admin,
      "update",
      regola.id,
      `Regola "${regola.id}" ${regola.attiva ? `attivata (${regola.valore})` : "disattivata"}`
    );
    return NextResponse.json(regola);
  } catch {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}
