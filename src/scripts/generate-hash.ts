/**
 * Script CLI per generare hash bcrypt di una password.
 *
 * Uso:
 *   npm run generate-hash -- "la-tua-password"
 *   npx tsx src/scripts/generate-hash.ts "la-tua-password"
 *
 * Output: l'hash bcrypt da inserire nella colonna password_hash di Supabase.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error("❌ Uso: npm run generate-hash -- \"la-tua-password\"");
    console.error("   Esempio: npm run generate-hash -- \"sanmarco2026\"");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

}

main();
