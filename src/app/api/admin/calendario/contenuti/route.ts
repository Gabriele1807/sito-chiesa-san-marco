import { NextResponse } from "next/server";
import {
  afterWrite,
  badRequest,
  readJson,
  requireCalendarioAdmin,
  unauthorized,
} from "@/lib/admin/calendario-route";
import {
  deleteContenuto,
  listContenuti,
  parseLevel,
  upsertContenuto,
  validateContenuto,
} from "@/lib/mongo/calendario";
import { isValidContentKey } from "@/lib/calendario/content";

/** GET ?livello=fixed&chiavi=04-27,E-105 — elenco per il pannello (bozze comprese). */
export async function GET(request: Request) {
  if (!(await requireCalendarioAdmin("calendario.read"))) return unauthorized();
  const params = new URL(request.url).searchParams;
  const livelloParam = params.get("livello");
  const livello = livelloParam ? parseLevel(livelloParam) : undefined;
  if (livelloParam && !livello) return badRequest("Livello non valido");
  const chiaviParam = params.get("chiavi");
  const chiavi = chiaviParam
    ? chiaviParam
        .split(",")
        .slice(0, 50)
        .filter((k) => /^[0-9A-Za-z+\-]{1,16}$/.test(k))
    : undefined;
  try {
    return NextResponse.json(await listContenuti({ livello: livello ?? undefined, chiavi }));
  } catch {
    return NextResponse.json({ error: "Database non raggiungibile" }, { status: 503 });
  }
}

/** PUT — crea o aggiorna il contenuto di una chiave. */
export async function PUT(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const parsed = validateContenuto(await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  try {
    const saved = await upsertContenuto(parsed.data, admin.username);
    await afterWrite(
      admin,
      "update",
      `${saved.livello}:${saved.chiave}`,
      `Contenuto ${saved.livello} "${saved.chiave}" (${saved.stato})`
    );
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Salvataggio non riuscito" }, { status: 500 });
  }
}

/** DELETE ?livello=fixed&chiave=04-27 */
export async function DELETE(request: Request) {
  const admin = await requireCalendarioAdmin("calendario.write");
  if (!admin) return unauthorized();
  const params = new URL(request.url).searchParams;
  const livello = parseLevel(params.get("livello"));
  const chiave = params.get("chiave");
  if (!livello || !isValidContentKey(livello, chiave)) return badRequest("Chiave non valida");
  try {
    if (!(await deleteContenuto(livello, chiave)))
      return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    await afterWrite(admin, "delete", `${livello}:${chiave}`, `Contenuto ${livello} "${chiave}"`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
