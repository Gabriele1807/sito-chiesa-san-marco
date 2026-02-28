# Setup Area Admin – Supabase Auth

Guida passo-passo per configurare l'autenticazione admin basata su Supabase PostgreSQL.

---

## 1. Creare un progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e accedi (o crea un account gratuito)
2. Clicca **New Project**
3. Scegli un nome (es. `chiesa-san-marco`) e una password per il DB
4. Seleziona la **Region** più vicina (es. `eu-central-1` per l'Italia)
5. Attendi che il progetto sia pronto (~2 minuti)

## 2. Copiare le chiavi API

Dal **Dashboard** del progetto Supabase:

1. Vai su **Settings → API**
2. Copia i valori:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Configurare le variabili d'ambiente

Modifica il file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TUOPROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...la_tua_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...la_tua_service_role_key
ADMIN_SESSION_SECRET=una_stringa_random_segreta_di_almeno_32_caratteri
```

> ⚠️ **NON committare mai `.env.local`** — è già nel `.gitignore`.

## 4. Eseguire lo schema SQL

1. Nel dashboard Supabase vai su **SQL Editor**
2. Crea una **New Query**
3. Copia e incolla l'intero contenuto di `src/lib/supabase/schema.sql`
4. Clicca **Run**
5. Verifica che le tabelle `admin_users` e `admin_sessions` appaiano nel **Table Editor**

## 5. Creare il primo Super Admin

### Opzione A: Usare lo script CLI (consigliato)

```bash
# Genera l'hash bcrypt della password
npm run generate-hash -- "la_tua_password_sicura"
```

Copia l'hash generato e inseriscilo direttamente nel SQL Editor di Supabase:

```sql
INSERT INTO admin_users (username, email, password_hash, nome, cognome, ruolo)
VALUES (
  'admin',
  'admin@esempio.it',
  '$2a$12...il_tuo_hash_qui',
  'Nome',
  'Cognome',
  'superadmin'
);
```

### Opzione B: Usare il seed già presente nello schema

Lo schema SQL contiene già un INSERT commentato. Modificalo con i tuoi dati
e decommentalo prima di eseguire lo schema.

## 6. Verifica

1. Avvia il server di sviluppo: `npm run dev`
2. Vai su `http://localhost:3000/admin/login`
3. Inserisci le credenziali del super admin creato al passo 5
4. Dovresti accedere alla dashboard admin

## 7. Gestione Admin

Una volta loggato come **superadmin**:

- Nella sidebar apparirà il link **Gestione Admin**
- Da lì puoi creare nuovi admin, modificarli, attivarli/disattivarli, eliminarli
- Gli admin normali possono gestire i contenuti ma **non** altri admin

---

## Struttura file autenticazione

```
src/
├── lib/
│   ├── auth/
│   │   ├── password.ts      ← Hash/verifica password (bcrypt)
│   │   ├── session.ts       ← CRUD sessioni su Supabase
│   │   ├── permissions.ts   ← Sistema permessi ruoli
│   │   └── rate-limit.ts    ← Protezione brute-force login
│   └── supabase/
│       ├── client.ts        ← Client Supabase browser
│       ├── server.ts        ← Client Supabase server (service_role)
│       └── schema.sql       ← Schema SQL completo
├── middleware.ts             ← Protezione rotte admin
├── app/
│   ├── api/admin/
│   │   ├── login/route.ts   ← API login
│   │   ├── logout/route.ts  ← API logout
│   │   └── users/           ← API CRUD admin (superadmin only)
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── toggle/route.ts
│   └── admin/
│       ├── login/page.tsx    ← Pagina login
│       └── (dashboard)/
│           └── gestione-admin/page.tsx  ← UI gestione admin
└── scripts/
    └── generate-hash.ts     ← CLI per generare hash bcrypt
```

---

## Note di sicurezza

- Le password sono hashate con **bcrypt** (12 salt rounds)
- Le sessioni sono salvate nel DB con scadenza (24h default, 7gg con "Ricordami")
- Il **rate limiter** blocca dopo 5 tentativi falliti per IP (15 minuti)
- Il middleware valida ogni richiesta admin contro il DB Supabase
- La `SERVICE_ROLE_KEY` bypassa le RLS policies — usata solo lato server
- I cookie di sessione sono `httpOnly`, `sameSite: lax`, `secure` in produzione
