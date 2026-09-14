/**
 * Imposta esplicitamente hasPassword:true su tutti i documenti "users"
 * che ne sono privi. Non necessario per il funzionamento (il campo assente
 * è già trattato come true a runtime — vedi design spec §2.3), ma rende
 * lo stato esplicito nel DB. Idempotente: eseguibile più volte senza effetti
 * collaterali.
 *
 * Uso: npx tsx src/scripts/backfill-has-password.ts
 */
import "dotenv/config";
import { getDb } from "@/lib/mongo/client";

async function main() {
  const db = await getDb();
  const result = await db
    .collection("users")
    .updateMany({ hasPassword: { $exists: false } }, { $set: { hasPassword: true } });
  console.log(`Aggiornati ${result.modifiedCount} utenti con hasPassword:true esplicito.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
