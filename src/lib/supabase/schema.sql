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
-- Tabelle per i contenuti del sito
-- =============================================================

-- ========================
-- Icone sacre
-- ========================
CREATE TABLE IF NOT EXISTS icone (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL DEFAULT '',
  nome_santo TEXT NOT NULL DEFAULT '',
  descrizione TEXT NOT NULL DEFAULT '',
  descrizione_estesa TEXT NOT NULL DEFAULT '',
  posizione TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT '',
  immagini JSONB NOT NULL DEFAULT '[]',
  tecnica TEXT NOT NULL DEFAULT '',
  autore TEXT NOT NULL DEFAULT '',
  anno TEXT NOT NULL DEFAULT '',
  testi_correlati JSONB NOT NULL DEFAULT '[]',
  icone_correlate JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_icone_updated_at ON icone;
CREATE TRIGGER set_icone_updated_at
  BEFORE UPDATE ON icone
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- Testi sacri / Libreria
-- ========================
CREATE TABLE IF NOT EXISTS testi_sacri (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titolo TEXT NOT NULL DEFAULT '',
  autore TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Altro',
  descrizione TEXT NOT NULL DEFAULT '',
  url_pdf TEXT NOT NULL DEFAULT '',
  copertina TEXT NOT NULL DEFAULT '',
  icone_correlate JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_testi_sacri_updated_at ON testi_sacri;
CREATE TRIGGER set_testi_sacri_updated_at
  BEFORE UPDATE ON testi_sacri
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- Preghiere
-- ========================
CREATE TABLE IF NOT EXISTS preghiere (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titolo TEXT NOT NULL DEFAULT '',
  descrizione TEXT NOT NULL DEFAULT '',
  url_pdf TEXT,
  testo_inline TEXT,
  categoria TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_preghiere_updated_at ON preghiere;
CREATE TRIGGER set_preghiere_updated_at
  BEFORE UPDATE ON preghiere
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- Eventi
-- ========================
CREATE TABLE IF NOT EXISTS eventi (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  titolo TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '',
  data_fine TEXT,
  descrizione TEXT NOT NULL DEFAULT '',
  luogo TEXT NOT NULL DEFAULT '',
  posti_disponibili INTEGER,
  immagine TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_eventi_updated_at ON eventi;
CREATE TRIGGER set_eventi_updated_at
  BEFORE UPDATE ON eventi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- Orari settimanali
-- ========================
CREATE TABLE IF NOT EXISTS orari_settimanali (
  giorno TEXT PRIMARY KEY,
  celebrazioni JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- Indici per performance
-- ========================
CREATE INDEX IF NOT EXISTS idx_icone_slug ON icone(slug);
CREATE INDEX IF NOT EXISTS idx_testi_sacri_slug ON testi_sacri(slug);
CREATE INDEX IF NOT EXISTS idx_preghiere_slug ON preghiere(slug);
CREATE INDEX IF NOT EXISTS idx_eventi_slug ON eventi(slug);
CREATE INDEX IF NOT EXISTS idx_eventi_data ON eventi(data);
