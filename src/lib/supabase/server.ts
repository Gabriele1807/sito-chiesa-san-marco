/**
 * Client Supabase per uso ESCLUSIVAMENTE lato SERVER
 * (API routes, Server Components, middleware).
 *
 * Usa la SERVICE_ROLE_KEY che bypassa le Row Level Security policies.
 * ⚠️ NON importare MAI questo file in codice client / "use client".
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Variabili d'ambiente Supabase server mancanti. " +
    "Configura NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
