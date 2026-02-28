/**
 * Client Supabase per uso lato CLIENT (browser).
 * Usa la chiave anonima pubblica – sicura da esporre nel bundle.
 *
 * NOTA: Questo client NON ha privilegi admin.
 * Per operazioni admin usa il server client (server.ts).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variabili d'ambiente Supabase mancanti. " +
    "Configura NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
