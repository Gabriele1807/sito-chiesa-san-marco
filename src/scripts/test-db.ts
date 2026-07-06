/**
 * Script di test per verificare la connessione Supabase
 * e lo stato delle tabelle admin_users / admin_sessions.
 *
 * Esegui con: npx tsx src/scripts/test-db.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Carica .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;


// 1. Verifica variabili d'ambiente

if (!url || !key) {
  console.error("\n❌ Variabili d'ambiente mancanti. Controlla .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runTests() {
  // 2. Test connessione base
  try {
    const { data, error } = await supabase.from("admin_users").select("count", { count: "exact", head: true });
    if (error) {
      console.error(`   ❌ Errore: ${error.message}`);
      console.error(`   Codice: ${error.code}`);
      if (error.code === "PGRST204" || error.message.includes("does not exist") || error.code === "42P01") {
        console.error("\n   ⚠️  La tabella admin_users non esiste!");
        console.error("   Devi eseguire lo schema SQL nel SQL Editor di Supabase.");
        console.error("   File: src/lib/supabase/schema.sql");
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error(`   ❌ Errore di rete: ${err}`);
    return false;
  }
}

async function testTables() {
  // 3. Verifica tabella admin_users
  const { data: users, error: usersErr, count } = await supabase
    .from("admin_users")
    .select("id, username, email, nome, cognome, ruolo, attivo, created_at", { count: "exact" });

  if (usersErr) {
    console.error(`   ❌ Errore: ${usersErr.message}`);
    if (usersErr.message.includes("does not exist") || usersErr.code === "42P01") {
      console.error("   ⚠️  Tabella non trovata! Esegui schema.sql nel SQL Editor.");
    }
    return;
  }


  if (users && users.length > 0) {
    users.forEach((u) => {
    });
  } else {
  }

  // 4. Verifica tabella admin_sessions
  const { data: sessions, error: sessErr, count: sessCount } = await supabase
    .from("admin_sessions")
    .select("id", { count: "exact" });

  if (sessErr) {
    console.error(`   ❌ Errore: ${sessErr.message}`);
    if (sessErr.message.includes("does not exist") || sessErr.code === "42P01") {
      console.error("   ⚠️  Tabella non trovata! Esegui schema.sql nel SQL Editor.");
    }
    return;
  }


  // 5. Test scrittura (insert + delete test row)
  const testUsername = `__test_${Date.now()}`;
  const { data: inserted, error: insErr } = await supabase
    .from("admin_users")
    .insert({
      username: testUsername,
      password_hash: "$2a$12$test_hash_not_real",
      nome: "Test",
      cognome: "Temporaneo",
      ruolo: "admin",
      attivo: false,
    })
    .select("id")
    .single();

  if (insErr) {
    console.error(`   ❌ INSERT fallito: ${insErr.message}`);
    return;
  }


  // Pulizia: elimina la riga di test
  const { error: delErr } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", inserted.id);

  if (delErr) {
    console.error(`   ⚠️  DELETE pulizia fallito: ${delErr.message}`);
  } else {
  }

}

async function main() {
  const connected = await runTests();
  if (connected) {
    await testTables();
  }
}

main().catch((err) => {
  console.error("\n❌ Errore imprevisto:", err);
  process.exit(1);
});
