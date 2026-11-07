import { NextResponse } from "next/server";
import {
  afterWrite,
  badRequest,
  readJson,
  requireCalendarioAdmin,
  unauthorized,
} from "@/lib/admin/calendario-route";
import {
  createFesta,
  deleteFesta,
  ensureCalendarioSeeded,
  listFeste,
  updateFesta,
  validateFesta,
  type FestaInput,
} from "@/lib/mongo/calendario";

export async function GET() {
  if (!(await requireCalendarioAdmin("calendario.read"))) return unauthorized();
  try {
    await ensureCalendarioSeeded();
    return NextResponse.json(await listFeste());
  } catch {
    return NextResponse.json({ error: "Database non raggiungibile" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const parsed = validateFesta(await readJson(request), "create");
  if (!parsed.ok) return badRequest(parsed.error);
  try {
    const festa = await createFesta(parsed.data as FestaInput, admin.username);
    if (!festa) return NextResponse.json({ error: "Identificativo già usato" }, { status: 409 });
    await afterWrite(admin, "create", festa.id, `Festa fissa "${festa.nome.it}"`);
    return NextResponse.json(festa, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const body = await readJson(request);
  const id = (body as { id?: unknown } | undefined)?.id;
  if (typeof id !== "string" || id.length > 40) return badRequest("ID mancante");
  const parsed = validateFesta(body, "update");
  if (!parsed.ok) return badRequest(parsed.error);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _ignored, ...data } = parsed.data;
  try {
    const festa = await updateFesta(id, data, admin.username);
    if (!festa) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
    await afterWrite(admin, "update", festa.id, `Festa fissa "${festa.nome.it}"`);
    return NextResponse.json(festa);
  } catch {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 40) return badRequest("ID mancante");
  try {
    if (!(await deleteFesta(id)))
      return NextResponse.json({ error: "Non trovata" }, { status: 404 });
    await afterWrite(admin, "delete", id, `Festa fissa "${id}"`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
