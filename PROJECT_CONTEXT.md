# PROJECT_CONTEXT.md – Chiesa di San Marco (Chiesa Copta Ortodossa di Milano)

> Documento di contesto completo del progetto. Ultimo aggiornamento: 28 febbraio 2026 (sessione 2).

---

## 1. Panoramica

Sito web bilingue (italiano/arabo) per la Chiesa Copta Ortodossa di San Marco a Milano.
Include un'area pubblica per i fedeli e un pannello admin completo per la gestione dei contenuti.

**URL locale dev:** `http://localhost:3000`
**Workspace:** `C:\Users\Gabriele\Downloads\sito\chiesa-san-marco`
**OS:** Windows

---

## 2. Stack tecnologico

| Tecnologia            | Versione | Scopo                                   |
|-----------------------|----------|-----------------------------------------|
| Next.js               | 16.1.6   | Framework React (App Router, Turbopack) |
| React                 | 19.2.3   | UI Library                              |
| TypeScript            | ~5.x     | Linguaggio                              |
| TailwindCSS           | v4       | CSS utility-first (via @tailwindcss/postcss, sintassi `@theme`) |
| next-intl             | 4.8.3    | Internazionalizzazione IT/AR            |
| Supabase (supabase-js)| 2.98.0   | Database PostgreSQL + Auth              |
| bcryptjs              | 3.0.3    | Hashing password (12 salt rounds)       |
| lucide-react          | 0.575.0  | Icone SVG                               |
| react-qr-code         | 2.0.18   | Generazione QR code                     |
| React Compiler        | 1.0.0    | Ottimizzazione automatica memo          |
| Node.js               | 24.12.0  | Runtime                                 |

---

## 3. Struttura directory

```
chiesa-san-marco/
├── .env.local                    ← Variabili ambiente (non committare!)
├── ADMIN_SETUP.md                ← Guida setup autenticazione
├── PROJECT_CONTEXT.md            ← Questo file
├── next.config.ts                ← Config Next.js + next-intl plugin
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
│
├── public/                       ← Asset statici
│
├── src/
│   ├── middleware.ts              ← Protezione rotte admin (valida sessione DB via Supabase)
│   │
│   ├── i18n/
│   │   └── request.ts            ← Config next-intl (legge cookie "locale")
│   │
│   ├── messages/
│   │   ├── it.json               ← Traduzioni italiano
│   │   └── ar.json               ← Traduzioni arabo
│   │
│   ├── types/
│   │   └── index.ts              ← Tipi TS: Icona, TestoSacro, Preghiera, Evento, ecc.
│   │
│   ├── lib/
│   │   ├── actions.ts            ← Server Actions
│   │   ├── db.ts                 ← (legacy, non più usato per auth)
│   │   ├── mock-data.ts          ← Dati di esempio per contenuti
│   │   │
│   │   ├── data/
│   │   │   └── store.ts          ← Store in memoria (globalThis) per CRUD contenuti
│   │   │
│   │   ├── auth/
│   │   │   ├── password.ts       ← hashPassword(), verifyPassword() con bcrypt
│   │   │   ├── session.ts        ← createSession(), validateSession(), deleteSession()
│   │   │   ├── permissions.ts    ← PERMISSIONS, ROLE_PERMISSIONS, hasPermission()
│   │   │   └── rate-limit.ts     ← Rate limiter in memoria (5 tentativi / 15 min)
│   │   │
│   │   └── supabase/
│   │       ├── client.ts         ← Client browser (anon key)
│   │       ├── server.ts         ← Client server (service_role key)
│   │       └── schema.sql        ← Schema SQL: admin_users, admin_sessions
│   │
│   ├── scripts/
│   │   ├── generate-hash.ts      ← CLI: npm run generate-hash -- "password"
│   │   └── test-db.ts            ← Script test connessione DB
│   │
│   ├── components/
│   │   ├── EventiList.tsx         ← Lista eventi (client)
│   │   ├── Footer.tsx             ← Footer sito pubblico
│   │   ├── IconaQRSection.tsx     ← Sezione QR per icona
│   │   ├── IconeGrid.tsx          ← Griglia icone
│   │   ├── LanguageSwitcher.tsx   ← Cambio lingua IT/AR
│   │   ├── MobileMenuButton.tsx   ← Hamburger menu mobile (sito pubblico)
│   │   ├── Navbar.tsx             ← Navbar pubblica (server component, include link admin)
│   │   ├── PreghieraExpand.tsx    ← Espandi preghiera
│   │   ├── Sidebar.tsx            ← Sidebar navigazione pubblica (responsive con overlay)
│   │   ├── TopbarTitle.tsx        ← Titolo dinamico pagina pubblica
│   │   │
│   │   └── admin/
│   │       ├── AdminMobileMenuButton.tsx ← Hamburger menu mobile area admin
│   │       ├── AdminSidebar.tsx       ← Sidebar admin (client, responsive) con overlay mobile
│   │       ├── AdminTopbarTitle.tsx   ← Titolo pagina admin
│   │       ├── AdminToast.tsx         ← Notifiche toast area admin
│   │       └── ConfirmModal.tsx       ← Modal di conferma eliminazione
│   │
│   └── app/
│       ├── globals.css            ← CSS globali + Tailwind @theme + token colori
│       ├── layout.tsx             ← Root layout (suppressHydrationWarning, Inter font)
│       │
│       ├── (main)/                ← Route group: sito pubblico
│       │   ├── layout.tsx         ← Layout pubblico (Navbar + Sidebar + Footer)
│       │   ├── page.tsx           ← Homepage
│       │   ├── chi-siamo/page.tsx
│       │   ├── eventi/page.tsx
│       │   ├── icone/page.tsx
│       │   ├── icone/[slug]/page.tsx
│       │   ├── libreria/page.tsx
│       │   ├── libreria/[slug]/page.tsx
│       │   ├── orari/page.tsx
│       │   └── preghiere/page.tsx
│       │
│       ├── admin/
│       │   ├── layout.tsx         ← Layout admin (Sidebar + Topbar)
│       │   ├── login/
│       │   │   ├── layout.tsx     ← Layout login (centrato, sfondo scuro bg-[#0F1A2E])
│       │   │   └── page.tsx       ← Form login con "Ricordami" + sessione scaduta
│       │   │
│       │   └── (dashboard)/       ← Route group: pagine admin protette
│       │       ├── page.tsx       ← Dashboard con statistiche
│       │       ├── libreria/page.tsx
│       │       ├── icone/page.tsx
│       │       ├── orari/page.tsx
│       │       ├── eventi/page.tsx
│       │       ├── preghiere/page.tsx
│       │       ├── libreria-privata/page.tsx
│       │       └── gestione-admin/page.tsx  ← CRUD admin (solo superadmin)
│       │
│       └── api/
│           ├── eventi/iscrizione/route.ts   ← API iscrizione eventi (pubblica)
│           │
│           └── admin/
│               ├── login/route.ts           ← POST login (Supabase + bcrypt)
│               ├── logout/route.ts          ← POST logout (elimina sessione DB)
│               ├── libreria/route.ts        ← CRUD libri
│               ├── icone/route.ts           ← CRUD icone
│               ├── orari/route.ts           ← CRUD orari
│               ├── eventi/route.ts          ← CRUD eventi
│               ├── preghiere/route.ts       ← CRUD preghiere
│               ├── libreria-privata/route.ts← CRUD file privati
│               └── users/                   ← CRUD admin users (superadmin only)
│                   ├── route.ts             ← GET lista, POST crea
│                   └── [id]/
│                       ├── route.ts         ← PUT modifica, DELETE elimina
│                       └── toggle/route.ts  ← PATCH attiva/disattiva
```

---

## 4. Tema e colori

### Sito pubblico (globals.css con `@theme`)

Il sito pubblico usa **token di colore custom** definiti nel blocco `@theme` di TailwindCSS v4 in `src/app/globals.css`.
Le classi Tailwind corrispondenti sono: `bg-primary`, `text-accent`, `bg-sidebar`, `bg-surface`, ecc.

| Token                | Valore   | Uso                                     |
|----------------------|----------|-----------------------------------------|
| `--color-background` | `#FFFFFF`| Sfondo body                             |
| `--color-foreground` | `#111827`| Testo principale                        |
| `--color-primary`    | `#1E3A5F`| Blu scuro brand (navbar, CTA, footer)   |
| `--color-primary-light`| `#2563EB`| Blu vivace per link/hover             |
| `--color-accent`     | `#B45309`| Ambra scuro (titoli, badge)             |
| `--color-accent-light`| `#D97706`| Ambra per hover, link sidebar          |
| `--color-danger`     | `#DC2626`| Rosso per errori/eliminazione           |
| `--color-surface`    | `#FFFFFF`| Card, pannelli                          |
| `--color-surface-alt`| `#F9FAFB`| Sfondo alternato                        |
| `--color-sidebar`    | `#111827`| Sfondo sidebar pubblica (grigio scuro)  |
| `--color-sidebar-hover`| `#1F2937`| Hover link sidebar                    |

> **IMPORTANTE:** Le classi gray-* e slate-* usano i valori DEFAULT di Tailwind (non sono sovrascritta).
> NON aggiungere `--color-gray-*` o `--color-slate-*` custom in @theme, altrimenti si corrompiono i colori.

### Area admin (colori hardcoded)

L'area admin usa colori **hardcoded** nelle classi Tailwind (non token):

| Colore     | Valore hex | Uso                                   |
|------------|-----------|---------------------------------------|
| Oro brand  | `#D4AF37` | Bottoni, accenti, link attivi admin   |
| Oro hover  | `#C5A028` | Hover bottoni admin                   |
| Blu scuro  | `#0F1A2E` | Sfondo sidebar admin, sfondo login    |
| Sfondo     | `#F8F9FA` | Background pagine dashboard           |

---

## 5. Flusso di autenticazione

### Login
1. L'utente invia `POST /api/admin/login` con `{ username, password, rememberMe }`
2. **Rate limiter** controlla se l'IP è bloccato (max 5 tentativi in 15 min)
3. Cerca `username` nella tabella `admin_users` su Supabase
4. Verifica password con `bcrypt.compare()`
5. Controlla che l'account sia `attivo = true`
6. Crea una riga in `admin_sessions` con token UUID, scadenza (24h o 7gg), IP, user-agent
7. Imposta cookie `admin_session` con il token (httpOnly, secure, sameSite: lax)
8. Ritorna `{ success: true, user: { nome, cognome, ruolo } }`
9. Il client salva `user` in `localStorage` per la sidebar

### Middleware (ogni richiesta /admin/*)
1. Legge il cookie `admin_session`
2. Query Supabase: `admin_sessions` JOIN `admin_users` su `session_token`
3. Verifica scadenza e `attivo`
4. Se valido: aggiunge header `x-admin-user-id`, `x-admin-ruolo`, `x-admin-username`
5. Se invalido: redirect a `/admin/login?session=expired` (rotte API → 401 JSON)

### Logout
1. `POST /api/admin/logout`
2. Legge token dal cookie → `deleteSession(token)` elimina riga da DB
3. Elimina cookie → redirect al sito

### Credenziali attuali nel DB
- Username: `admin`, Password: `SanMarco2026`, Ruolo: `superadmin`

---

## 6. Database Supabase

### Tabella `admin_users`
| Colonna        | Tipo                                | Note                            |
|----------------|-------------------------------------|---------------------------------|
| id             | UUID (PK, gen_random_uuid)          |                                 |
| username       | VARCHAR(50) UNIQUE NOT NULL         |                                 |
| email          | VARCHAR(255)                        | Opzionale                       |
| password_hash  | TEXT NOT NULL                        | bcrypt hash                     |
| nome           | VARCHAR(100) NOT NULL               |                                 |
| cognome        | VARCHAR(100) NOT NULL               |                                 |
| ruolo          | VARCHAR(20) CHECK (superadmin/admin)|                                 |
| attivo         | BOOLEAN DEFAULT true                |                                 |
| ultimo_accesso | TIMESTAMPTZ                         | Aggiornato ad ogni login        |
| creato_il      | TIMESTAMPTZ DEFAULT now()           |                                 |
| aggiornato_il  | TIMESTAMPTZ DEFAULT now()           | Trigger automatico              |

### Tabella `admin_sessions`
| Colonna        | Tipo                              | Note                              |
|----------------|-----------------------------------|-----------------------------------|
| id             | UUID (PK, gen_random_uuid)        |                                   |
| admin_user_id  | UUID FK → admin_users(id) CASCADE |                                   |
| session_token  | TEXT UNIQUE NOT NULL               | crypto.randomUUID()               |
| expires_at     | TIMESTAMPTZ NOT NULL              | 24h o 7gg                         |
| ip_address     | VARCHAR(45)                       |                                   |
| user_agent     | TEXT                              |                                   |
| creato_il      | TIMESTAMPTZ DEFAULT now()         |                                   |

---

## 7. Sistema di permessi

Due ruoli: **superadmin** e **admin**.

| Permesso               | superadmin | admin |
|------------------------|:----------:|:-----:|
| libreria.read/write    | ✅         | ✅    |
| icone.read/write       | ✅         | ✅    |
| orari.read/write       | ✅         | ✅    |
| eventi.read/write      | ✅         | ✅    |
| preghiere.read/write   | ✅         | ✅    |
| libreria-privata.r/w   | ✅         | ✅    |
| admin.read/write/toggle| ✅         | ❌    |

---

## 8. Internazionalizzazione (i18n)

- Gestita con `next-intl` v4
- La lingua è salvata nel cookie `locale` (default: `it`)
- File traduzioni: `src/messages/it.json`, `src/messages/ar.json`
- `LanguageSwitcher` cambia il cookie e ricarica la pagina
- L'area admin è **solo in italiano** (non tradotta)

---

## 9. Gestione contenuti (dati sito)

I contenuti del sito (libri, icone, preghiere, eventi, orari, file privati) sono
gestiti tramite uno **store in memoria** con pattern `globalThis`:

- `src/lib/data/store.ts` → funzioni `getLibri()`, `addLibro()`, `deleteLibro()`, ecc.
- I dati iniziali provengono da `src/lib/mock-data.ts`
- Le API admin (`/api/admin/libreria`, ecc.) usano queste funzioni
- Le pagine pubbliche hanno `export const dynamic = "force-dynamic"` per leggere sempre dal live store

> **NOTA:** I contenuti sono in memoria e si resettano al riavvio del server.
> Per persistenza vera, sostituire lo store con query Supabase (futuro).

---

## 10. Comandi utili

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build
npm start

# Generare hash bcrypt
npm run generate-hash -- "password"

# Linting
npm run lint

# Uccidere processi Node bloccati (Windows)
taskkill /f /im node.exe

# Pulire cache build e riavviare
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run dev
```

---

## 11. Variabili d'ambiente (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=       # URL progetto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Chiave pubblica anon
SUPABASE_SERVICE_ROLE_KEY=      # Chiave server (secret!)
ADMIN_SESSION_SECRET=           # Stringa random per sicurezza sessioni
```

---

## 12. Convenzioni di codice

- **Server Components** per default; `"use client"` solo dove serve interattività
- **`export const dynamic = "force-dynamic"`** su tutte le pagine pubbliche con dati live
- **Layout con route groups:** `(main)` per il sito pubblico, `(dashboard)` per admin
- **TailwindCSS v4:** usare `@theme {}` per definire token custom (NON `:root {}`)
- **Colori brand pubblico:** primary `#1E3A5F`, accent `#B45309`, sidebar `#111827` (tramite token `@theme`)
- **Colori brand admin:** oro `#D4AF37`, navy `#0F1A2E` (hardcoded nelle classi)
- **Cookie di autenticazione:** `admin_session` (httpOnly)
- **Cookie di lingua:** `locale` (`it` | `ar`)
- **localStorage:** `admin_info` (JSON: { nome, cognome, ruolo }) — per mostrare info utente nella sidebar senza query extra

---

## 13. Problemi noti e avvertenze

1. **Next.js 16 deprecation:** warning su `middleware.ts` → verrà rinominato in `proxy.ts` nelle versioni future
2. **Lockfile multipli:** esiste un `package-lock.json` nella cartella padre `sito/` che causa warning; ignorare
3. **Il rate limiter è in memoria:** in ambiente serverless (Vercel) ogni istanza ha il suo contatore. Per sicurezza reale, usare Redis
4. **I contenuti del sito sono in memoria:** si resettano al riavvio del server. Solo l'autenticazione è persistita su Supabase
5. **`suppressHydrationWarning`** è su `<html>` e `<body>` nel root layout per evitare errori con estensioni browser
6. **NON aggiungere `--color-gray-*` o `--color-slate-*` in `@theme`:** sovrascriverebbero la palette Tailwind con colori sbagliati, corrompendo l'intero sito
7. **NON aggiungere `zoom` in globals.css:** causa layout distorto
8. **Per aggiungere un nuovo tipo di contenuto:** creare tipo in `types/index.ts`, aggiungere dati in `mock-data.ts`, funzioni CRUD in `store.ts`, API route, pagina admin, pagina pubblica

---

## 14. Stato attuale del progetto (28/02/2026)

### Funzionalità completate ✅
- Sito pubblico bilingue IT/AR completo (8 pagine: home, chi-siamo, orari, icone, icone/[slug], libreria, libreria/[slug], eventi, preghiere)
- Pannello admin completo con CRUD per tutti i contenuti (libreria, icone, orari, eventi, preghiere, libreria-privata)
- Gestione admin users (CRUD, solo superadmin) — pagina gestione-admin
- Autenticazione completa su Supabase (login, logout, middleware, sessioni DB, rate limiting)
- Tema pubblico riscritto e funzionante (senza zoom, con colori neutrali puliti)
- Tema admin con colori oro/navy
- **Area admin completamente responsive** (sidebar mobile con hamburger + overlay, topbar e content full-width su mobile, tabelle con scroll orizzontale, form e header responsive)

### Dettagli responsività admin (sessione 2)
L'area admin ora segue lo stesso pattern responsive del sito pubblico:
- **AdminMobileMenuButton** (`src/components/admin/AdminMobileMenuButton.tsx`): hamburger visibile solo sotto `lg:`, toggle sidebar mobile via DOM
- **AdminSidebar** (`src/components/admin/AdminSidebar.tsx`): nascosta su mobile (`-translate-x-full`), visibile su desktop (`lg:translate-x-0`), overlay scuro, transizione animata, closeMobile su tutti i Link
- **Admin layout** (`src/app/admin/layout.tsx`): topbar `left-0 lg:left-[260px]`, content `lg:ml-[260px]`, padding `p-4 sm:p-6 lg:p-8`
- **Tutte le pagine dashboard**: tabelle con `overflow-x-auto` + `min-w-[600px]`, header `flex-wrap gap-4`
- **Orari page**: form celebrazioni `flex-col sm:flex-row`, input con width responsive
- IDs DOM usati: `admin-mobile-sidebar`, `admin-sidebar-overlay` (diversi da quelli pubblici `mobile-sidebar`, `sidebar-overlay`)

### Da fare / Miglioramenti futuri 📋
- Persistere i contenuti del sito su Supabase (attualmente in memoria, si resettano al riavvio)
- Upload immagini (attualmente i contenuti usano URL placeholder o nessuna immagine)
- SEO avanzato (meta tag per pagine singole, sitemap, Open Graph)
- Progressive Web App (PWA)
- Migrare rate limiter a Redis per produzione
- Eventuale rinomina `middleware.ts` → `proxy.ts` quando Next.js lo richiederà
