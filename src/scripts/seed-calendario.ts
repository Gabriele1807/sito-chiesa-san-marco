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
import "dotenv/config";
import { getDb } from "@/lib/mongo/client";
import { applySchemaValidators, seedCalendario } from "@/lib/mongo/calendario";

async function main() {
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
