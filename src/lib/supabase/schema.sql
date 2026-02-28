-- =============================================================
-- SCHEMA DATABASE – Chiesa Copta Ortodossa di San Marco, Milano
-- =============================================================
--
-- COME USARE:
-- 1. Vai su https://supabase.com/dashboard
-- 2. Apri il tuo progetto → SQL Editor
-- 3. Incolla TUTTO questo file e clicca "Run"
--
-- DOPO aver eseguito lo schema:
-- 1. Genera l'hash bcrypt della password del primo admin:
--      npm run generate-hash -- "sanmarco2026"
-- 2. Copia l'hash generato
-- 3. Sostituisci il PLACEHOLDER nell'INSERT sotto, oppure
--    esegui manualmente:
--      UPDATE admin_users SET password_hash = 'HASH_COPIATO'
--      WHERE username = 'admin';
-- =============================================================

-- ========================
-- Tabella amministratori
-- ========================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo TEXT NOT NULL DEFAULT 'admin' CHECK (ruolo IN ('superadmin', 'admin')),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ultimo_accesso TIMESTAMPTZ
);

-- ========================
-- Tabella sessioni admin
-- ========================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ========================
-- Indici per performance
-- ========================
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- ========================
-- Trigger per aggiornare updated_at automaticamente
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- Primo superadmin
-- ========================
-- ⚠️ SOSTITUISCI il placeholder con l'hash reale generato da:
--   npm run generate-hash -- "sanmarco2026"
--
-- Esempio output: $2b$12$xYz... (stringa di ~60 caratteri)
-- Incolla al posto di '$2b$12$PLACEHOLDER_SOSTITUIRE_CON_HASH_REALE'
-- ========================
INSERT INTO admin_users (username, email, password_hash, nome, cognome, ruolo)
VALUES (
  'admin',
  'admin@sanmarcomilano.it',
  '$2b$12$PLACEHOLDER_SOSTITUIRE_CON_HASH_REALE',
  'Amministratore',
  'Principale',
  'superadmin'
) ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- FUTURO: Tabelle per i dati del sito (libri, icone, orari, ecc.)
-- Attualmente gestiti da src/lib/data/store.ts in memoria.
-- Quando pronti, creare qui le tabelle e migrare i dati.
-- =============================================================
