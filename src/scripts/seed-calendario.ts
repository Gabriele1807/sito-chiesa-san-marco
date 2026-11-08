/**
 * Seed idempotente del calendario liturgico:
 * - feste fisse certe (Nayrouz, Croce, Epifania, Annunciazione, Apostoli, Assunzione);
 * - regole incerte, tutte DISATTIVATE;
 * - località predefinita (Milano);
 * - sezione di visibilità "calendario";
 * - validatori $jsonSchema e indici unici.
 *
 * Usa solo $setOnInsert: rieseguirlo non crea duplicati e non sovrascrive le
 * modifiche fatte dal pannello admin.
 *
 * Uso: npm run seed-calendario
 */
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const [{ getDb }, { applySchemaValidators, seedCalendario }] = await Promise.all([
    import("@/lib/mongo/client"),
    import("@/lib/mongo/calendario"),
  ]);
  const db = await getDb();
  await applySchemaValidators(db);
  const report = await seedCalendario(db);
  for (const [collection, n] of Object.entries(report.inserted)) {
    console.log(`${collection}: ${n} documenti inseriti`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
