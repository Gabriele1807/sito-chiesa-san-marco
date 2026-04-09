# PROJECT_CONTEXT.md - Chiesa di San Marco (Chiesa Copta Ortodossa di Milano)

> Documento di contesto operativo del progetto. Ultimo aggiornamento: 9 aprile 2026.

---

## 1. Scopo del progetto

Sito web bilingue italiano/arabo per la Chiesa Copta Ortodossa di San Marco a Milano.
Il progetto ha due aree principali:

- area pubblica per fedeli e visitatori
- area admin protetta per gestione contenuti e utenti amministratori

Obiettivo pratico del file: dare a un'altra AI o a un altro sviluppatore tutto il contesto necessario per lavorare sul progetto senza dover ricostruire da zero architettura, stack, convenzioni, limiti e comportamenti già implementati.

---

## 2. Snapshot rapido

| Voce | Valore |
|------|--------|
| Nome progetto | chiesa-san-marco |
| Workspace Windows | C:\Users\Gabriele\Downloads\sito\chiesa-san-marco |
| URL dev previsto | http://localhost:3000 |
| Framework | Next.js 16 App Router |
| Lingue | italiano, arabo |
| Frontend pubblico | next-intl + TailwindCSS v4 |
| Admin auth | Supabase + sessioni DB + cookie httpOnly |
| Persistenza contenuti | NO, attualmente store in memoria |
| Persistenza autenticazione | SI, Supabase |
| Area admin tradotta | No, solo italiano |

Fatti importanti da sapere subito:

- il sito pubblico e l'area admin condividono lo stesso progetto Next.js
- i contenuti del sito non sono ancora persistiti su database: vengono caricati da mock data e poi mantenuti in memoria tramite globalThis
- l'autenticazione admin invece e persistita su Supabase
- la route di login admin non deve mostrare sidebar o topbar admin
- la dashboard admin e gia stata ripulita dalle ridondanze: non deve tornare a contenere link duplicati della sidebar

---

## 3. Stack tecnologico reale

Versioni lette da package.json:

| Tecnologia | Versione | Uso |
|------------|----------|-----|
| next | 16.1.6 | App Router, server components, middleware |
| react | 19.2.3 | UI |
| react-dom | 19.2.3 | UI runtime |
| typescript | ^5 | tipizzazione |
| tailwindcss | ^4 | styling |
| @tailwindcss/postcss | ^4 | integrazione Tailwind |
| next-intl | ^4.8.3 | i18n IT/AR |
| @supabase/supabase-js | ^2.98.0 | DB auth/sessioni |
| bcryptjs | ^3.0.3 | verifica hash password |
| lucide-react | ^0.575.0 | icone |
| react-qr-code | ^2.0.18 | generazione QR |
| babel-plugin-react-compiler | 1.0.0 | React Compiler |
| dotenv | ^17.3.1 | variabili ambiente negli script |
| eslint | ^9 | lint |

Script disponibili:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run generate-hash -- "password"
```

Nota pratica:

- nel parent folder esiste un altro package-lock.json che puo generare warning di tooling; il progetto corretto e solo chiesa-san-marco

---

## 4. Architettura generale

### 4.1 Route groups

Il progetto usa App Router con due route groups principali:

- `(main)` per il sito pubblico
- `admin/(dashboard)` per l'area admin protetta

### 4.2 Layout reali attuali

Attenzione: questo punto era obsoleto in versioni precedenti del file.

- `src/app/layout.tsx`
  - root layout globale
  - usa font Inter via `next/font/google`
  - avvolge l'app con `NextIntlClientProvider`
  - imposta `lang`, `dir` e `suppressHydrationWarning`

- `src/app/(main)/layout.tsx`
  - layout pubblico
  - struttura: `Navbar + Sidebar + main content + Footer`
  - sidebar pubblica sempre disponibile, con comportamento responsive/mobile overlay

- `src/app/admin/layout.tsx`
  - layout admin base minimale
  - NON contiene sidebar/topbar
  - serve a fare in modo che `/admin/login` non erediti la shell admin

- `src/app/admin/login/layout.tsx`
  - layout centrato per la login admin
  - sfondo navy `#0F1A2E`
  - contenuto centrato con flex e `min-h-screen`

- `src/app/admin/(dashboard)/layout.tsx`
  - vero layout delle pagine admin protette
  - include `AdminSidebar`, topbar fissa, `AdminMobileMenuButton`, `AdminTopbarTitle`, `AdminToast`
  - content area con `lg:ml-[260px]` e `pt-14`
  - header topbar fisso `h-14` con border-b

Implicazione importante:

- se si modifica la shell admin, quasi sempre va toccato `src/app/admin/(dashboard)/layout.tsx`, non `src/app/admin/layout.tsx`

---

## 5. Struttura directory essenziale

```text
chiesa-san-marco/
|- ADMIN_SETUP.md
|- PROJECT_CONTEXT.md
|- next.config.ts
|- package.json
|- src/
|  |- middleware.ts
|  |- messages/
|  |  |- it.json
|  |  \- ar.json
|  |- i18n/
|  |  \- request.ts
|  |- types/
|  |  \- index.ts
|  |- lib/
|  |  |- mock-data.ts
|  |  |- db.ts
|  |  |- gdrive.ts
|  |  |- actions.ts
|  |  |- data/
|  |  |  \- store.ts
|  |  |- auth/
|  |  |  |- password.ts
|  |  |  |- permissions.ts
|  |  |  |- rate-limit.ts
|  |  |  \- session.ts
|  |  \- supabase/
|  |     |- client.ts
|  |     |- server.ts
|  |     \- schema.sql
|  |- components/
|  |  |- Navbar.tsx
|  |  |- Sidebar.tsx
|  |  |- Footer.tsx
|  |  |- TopbarTitle.tsx
|  |  |- EventiList.tsx
|  |  |- IconeGrid.tsx
|  |  |- IconaQRSection.tsx
|  |  |- LanguageSwitcher.tsx
|  |  |- MobileMenuButton.tsx
|  |  |- PreghieraExpand.tsx
|  |  \- admin/
|  |     |- AdminSidebar.tsx
|  |     |- AdminTopbarTitle.tsx
|  |     |- AdminMobileMenuButton.tsx
|  |     |- AdminToast.tsx
|  |     \- ConfirmModal.tsx
|  \- app/
|     |- globals.css
|     |- layout.tsx
|     |- (main)/
|     |  |- layout.tsx
|     |  |- page.tsx
|     |  |- chi-siamo/page.tsx
|     |  |- eventi/page.tsx
|     |  |- icone/page.tsx
|     |  |- icone/[slug]/page.tsx
|     |  |- libreria/page.tsx
|     |  |- libreria/[slug]/page.tsx
|     |  |- orari/page.tsx
|     |  \- preghiere/page.tsx
|     |- admin/
|     |  |- layout.tsx
|     |  |- login/
|     |  |  |- layout.tsx
|     |  |  \- page.tsx
|     |  \- (dashboard)/
|     |     |- layout.tsx
|     |     |- page.tsx
|     |     |- eventi/page.tsx
|     |     |- gestione-admin/page.tsx
|     |     |- icone/page.tsx
|     |     |- libreria/page.tsx
|     |     |- libreria-privata/page.tsx
|     |     |- orari/page.tsx
|     |     \- preghiere/page.tsx
|     \- api/
|        |- eventi/iscrizione/route.ts
|        \- admin/
|           |- login/route.ts
|           |- logout/route.ts
|           |- eventi/route.ts
|           |- icone/route.ts
|           |- libreria/route.ts
|           |- libreria-privata/route.ts
|           |- orari/route.ts
|           |- preghiere/route.ts
|           \- users/
|              |- route.ts
|              \- [id]/toggle/route.ts
```

---

## 6. Modello dati del sito

Tipi principali definiti in `src/types/index.ts`:

- `Icona`
- `TestoSacro`
- `Preghiera`
- `Evento`
- `IscrizioneEvento`
- `OrarioSettimanale`
- `Locale`

### 6.1 Dove stanno i dati

- `src/lib/mock-data.ts`
  - seed iniziale del sito
  - contiene icone, testi sacri, preghiere, eventi e orari settimanali

- `src/lib/data/store.ts`
  - store in memoria condiviso tramite `globalThis`
  - espone CRUD per tutti i contenuti
  - contiene anche il tipo `FilePrivato`
  - usa `nextId()` helper interno per generare ID numerici incrementali (FUTURO: sostituire con UUID DB)
  - commenti `// FUTURO: supabase.from(...)` marcano i punti di migrazione

- `src/lib/db.ts`
  - layer di astrazione async per i server components pubblici
  - legge dallo store, espone funzioni async (es. `getIcone()`, `getTestiSacri()`, ecc.)
  - FUTURO: qui si mettono le chiamate dirette a Supabase

- `src/lib/actions.ts`
  - server action `setLocale(locale)` per cambiare lingua via cookie (durata 1 anno)

- `src/lib/gdrive.ts`
  - utilità per normalizzare URL Google Drive in link immagine, embed PDF, download
  - funzione principale: `extractGDriveId(url)`

### 6.2 Conseguenza pratica fondamentale

I contenuti dell'area pubblica e admin:

- si possono modificare live da pannello admin
- ma si resettano quando il server si riavvia
- non sono ancora persistiti su Supabase

Quindi:

- se un task richiede dati permanenti, bisogna migrare lo store verso Supabase o altra persistenza
- non bisogna descrivere l'area contenuti come gia persistente: non lo e

---

## 7. Autenticazione admin

L'autenticazione admin e separata dalla gestione contenuti.

### 7.1 Componenti coinvolti

- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/logout/route.ts`
- `src/middleware.ts`
- `src/lib/auth/password.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/rate-limit.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/supabase/server.ts`

### 7.2 Login

Flusso reale attuale:

1. `POST /api/admin/login` riceve `username`, `password`, `rememberMe`
2. legge IP da `x-forwarded-for`
3. applica rate limiting in memoria: max 5 tentativi in 15 minuti
4. cerca l'utente in `admin_users`
5. controlla che `attivo === true`
6. verifica la password con bcrypt
7. resetta i tentativi falliti
8. pulisce le sessioni scadute in background
9. aggiorna `ultimo_accesso`
10. crea una riga in `admin_sessions`
11. imposta cookie httpOnly `admin_session`
12. ritorna JSON con `nome`, `cognome`, `ruolo`
13. il client salva questi dati in `localStorage` come `admin_info`

### 7.3 Durata sessione

Definita in `src/lib/auth/session.ts`:

- default: 24 ore
- con remember me: 7 giorni

### 7.4 Middleware

`src/middleware.ts`:

- protegge `/admin/:path*` e `/api/admin/:path*`
- esclude `/admin/login` e `/api/admin/login`
- valida la sessione via Supabase
- se la sessione e valida aggiunge gli header:
  - `x-admin-user-id`
  - `x-admin-ruolo`
  - `x-admin-username`
- se invalida:
  - redirect a `/admin/login?session=expired` per pagine
  - 401 JSON per API admin

### 7.5 Logout

- API `POST /api/admin/logout`
- elimina la sessione dal DB
- il client rimuove `admin_info` dal localStorage
- poi fa redirect alla home `/`

### 7.6 Ruoli e permessi

Ruoli supportati:

- `superadmin`
- `admin`

Permessi contenuti:

- libreria read/write
- icone read/write
- orari read/write
- eventi read/write
- preghiere read/write
- libreria-privata read/write

Permessi extra solo superadmin:

- admin.read
- admin.write
- admin.toggle

### 7.7 Credenziali note di sviluppo

Nel documento/setup corrente e indicato:

- username: `admin`
- password: `SanMarco2026`
- ruolo: `superadmin`

---

## 8. Database Supabase

Supabase viene usato attualmente solo per area admin auth/sessioni.

### 8.1 Tabelle principali

`admin_users`

- id UUID (gen_random_uuid)
- username TEXT UNIQUE NOT NULL
- email TEXT UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- nome TEXT NOT NULL
- cognome TEXT NOT NULL
- ruolo TEXT CHECK IN ('superadmin', 'admin'), default 'admin'
- attivo BOOLEAN, default true
- ultimo_accesso TIMESTAMPTZ (nullable)
- created_at TIMESTAMPTZ, default NOW()
- updated_at TIMESTAMPTZ, default NOW() (aggiornato da trigger)

`admin_sessions`

- id UUID (gen_random_uuid)
- admin_user_id UUID FK → admin_users(id) ON DELETE CASCADE
- session_token TEXT UNIQUE NOT NULL
- expires_at TIMESTAMPTZ NOT NULL
- ip_address TEXT
- user_agent TEXT
- created_at TIMESTAMPTZ, default NOW()

Indici presenti:

- `idx_admin_sessions_token` su `session_token`
- `idx_admin_sessions_expires` su `expires_at`
- `idx_admin_users_username` su `username`

Nota: i nomi colonne nel DB sono `created_at` / `updated_at` (snake_case inglese), non `creato_il` / `aggiornato_il`.

File schema di riferimento:

- `src/lib/supabase/schema.sql`

---

## 9. Internazionalizzazione

### 9.1 Libreria usata

- `next-intl`

### 9.2 Lingue

- italiano `it`
- arabo `ar`

### 9.3 Come viene scelta la lingua

- cookie `locale` (durata 1 anno, impostato da server action `setLocale`)
- default italiano
- `src/i18n/request.ts` legge il cookie con `cookies()` da `next/headers`
- `src/app/layout.tsx` imposta `lang` e `dir`

### 9.4 Traduzioni

File:

- `src/messages/it.json`
- `src/messages/ar.json`

Stato attuale:

- sito pubblico tradotto IT/AR
- area admin solo italiana

### 9.5 Dettagli UI gia sistemati

Questi punti sono gia implementati e non vanno persi in future modifiche:

- la sidebar pubblica usa chiavi i18n anche per i sottotitoli interni, non stringhe hardcoded
- il titolo topbar della home pubblica e `HOME` in italiano e la label corrispondente in arabo
- la data in homepage viene formattata in base alla lingua corrente
- i link di ritorno nelle pagine dettaglio di icone e libreria sono tradotti

---

## 10. Tema visuale e styling

### 10.1 Sito pubblico

Tailwind v4 con token definiti in `src/app/globals.css` via `@theme`.

Token principali:

| Token | Valore | Uso |
|-------|--------|-----|
| `--color-background` | `#FFFFFF` | sfondo generale |
| `--color-foreground` | `#111827` | testo principale |
| `--color-primary` | `#1E3A5F` | brand blu scuro |
| `--color-primary-light` | `#2563EB` | varianti link/hover |
| `--color-accent` | `#B45309` | ambra titoli/accenti |
| `--color-accent-light` | `#D97706` | ambra hover |
| `--color-danger` | `#DC2626` | errori |
| `--color-white` | `#FFFFFF` | bianco esplicito |
| `--color-surface` | `#FFFFFF` | card |
| `--color-surface-alt` | `#F9FAFB` | sfondi alternativi |
| `--color-sidebar` | `#111827` | sidebar pubblica |
| `--color-sidebar-hover` | `#1F2937` | hover sidebar |
| `--font-sans` | `var(--font-inter)` | font principale |

Importante:

- non aggiungere token custom `--color-gray-*` o `--color-slate-*` nel blocco `@theme`
- sovrascriverebbero la palette Tailwind standard e romperebbero il design

### 10.2 Admin

L'area admin non usa i token del sito pubblico come sistema principale.
Usa classi Tailwind dirette con palette:

- navy `#0F1A2E` per sidebar e login
- sfondo chiaro `#F8F9FA`
- accenti amber tramite classi Tailwind (`bg-amber-600`, `text-amber-600`, `hover:bg-amber-700`)
- blu per elementi secondari e widget eventi

Nota storica utile:

- il vecchio oro hardcoded `#D4AF37` e stato in larga parte sostituito con `amber-600` e relative varianti

### 10.3 Utility CSS globali gia presenti

In `src/app/globals.css` esistono gia:

- `.card-hover` con scale + box-shadow su hover (cubic-bezier 0.25s)
- `.btn-hover` con translateY(-1px) su hover
- `.btn-hover:focus-visible` con focus ring giallo ambra (accessibilita)
- `.sidebar-link` con transition per link sidebar

Stili globali aggiuntivi:

- scrollbar custom (webkit) con colori slate
- `[dir="rtl"] { text-align: right }` per arabo
- `html { scroll-behavior: smooth }`
- body usa font-family `var(--font-sans)`

### 10.4 Font

- font principale: Inter
- definito in root layout con CSS variable `--font-inter`

---

## 11. Area pubblica: comportamento e UX gia implementati

### 11.1 Layout pubblico

- navbar in alto
- sidebar laterale con overlay mobile
- footer sotto il contenuto
- `dir="rtl"` automatico per arabo

### 11.2 Pagine pubbliche presenti

- home
- chi siamo
- orari
- icone
- icone/[slug]
- libreria
- libreria/[slug]
- eventi
- preghiere

### 11.3 Comportamenti importanti gia fatti

- homepage:
  - stat cards cliccabili verso aree rilevanti
  - righe eventi cliccabili
  - righe preghiere cliccabili
  - badge giorno ingranditi e piu leggibili
  - sottotitolo home aggiornato e non generico

- pagina eventi:
  - iscrizione con telefono opzionale
  - nome e email restano obbligatori

- pagine icone:
  - griglia con hover piu chiaro e meno ambiguo
  - pagina dettaglio con bottone di ritorno alla galleria
  - sezione QR con feedback visivo dopo il download

- pagine libreria:
  - lista con hover piu coerente
  - pagina dettaglio con bottone di ritorno alla libreria

- pagina orari:
  - su mobile la colonna note e nascosta
  - giorni accentati correttamente, es. Martedi/Giovedi non devono essere senza accento

- pagina chi-siamo:
  - titoli card coerenti con la palette blu/ambra del sito

### 11.4 Integrazione Google Drive

Esiste `src/lib/gdrive.ts` per normalizzare URL immagini/PDF/preview/download.
Quando si lavora su contenuti remoti, verificare se il campo puo contenere URL Drive anziche percorsi locali.

---

## 12. Area admin: comportamento e UX gia implementati

### 12.1 Sidebar admin

`src/components/admin/AdminSidebar.tsx`:

- client component
- responsive con overlay mobile
- usa gli ID DOM:
  - `admin-mobile-sidebar`
  - `admin-sidebar-overlay`
- legge dati utente da `localStorage.admin_info` (aggiornato ad ogni cambio di pathname)
- link di navigazione definiti inline nel componente (array `links`)
- mostra `Gestione Admin` (icona `Users`) solo se `ruolo === "superadmin"`
- ha link `Torna al sito` con icona `ArrowLeft`
- il logout e separato da un divider e usa styling rosso dedicato (`text-red-400`, `hover:bg-red-500/10`)
- `handleLogout()`: chiama `POST /api/admin/logout`, rimuove `admin_info` da localStorage, redirect a `/`

### 12.2 Login admin

- pagina separata senza sidebar
- supporta banner `session=expired`
- supporta remember me da 7 giorni
- mostra tentativi rimasti quando l'API li restituisce

### 12.3 Dashboard admin attuale

La dashboard admin NON deve tornare a contenere una sezione di link duplicata della sidebar.

Stato corretto attuale di `src/app/admin/(dashboard)/page.tsx`:

- stat cards in alto con conteggi per:
  - libri/pdf
  - icone
  - preghiere
  - eventi futuri
  - file privati
- le card sono link cliccabili verso la sezione admin relativa
- colori: amber per contenuti statici, blue per eventi/file privati
- sezione `Prossimi eventi` (2/3 larghezza su lg)
  - mostra fino a 4 eventi futuri
  - include data, ora, luogo e posti disponibili
  - link "Vedi tutti" verso `/admin/eventi`
- sezione `Oggi` (1/3 larghezza su lg)
  - mostra le celebrazioni del giorno corrente dagli orari settimanali
- sezione `Azioni rapide`
  - pulsanti orientati alla creazione, non semplice navigazione duplicata
  - nuovo evento
  - nuovo libro/pdf
  - nuova preghiera
  - nuova icona

### 12.4 CRUD admin disponibili

Pagine protette:

- `/admin/libreria`
- `/admin/icone`
- `/admin/orari`
- `/admin/eventi`
- `/admin/preghiere`
- `/admin/libreria-privata`
- `/admin/gestione-admin` solo superadmin

### 12.5 Responsivita admin

Caratteristiche gia implementate:

- hamburger menu sotto breakpoint `lg`
- sidebar che slide-in su mobile
- overlay per chiusura rapida
- topbar fissa
- content area adattata a sidebar desktop
- tabelle admin pensate per scroll orizzontale nelle pagine CRUD

---

## 13. API esistenti

### 13.1 API pubblica

- `POST /api/eventi/iscrizione`

### 13.2 API admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- CRUD contenuti:
  - `/api/admin/libreria`
  - `/api/admin/icone`
  - `/api/admin/orari`
  - `/api/admin/eventi`
  - `/api/admin/preghiere`
  - `/api/admin/libreria-privata`
- gestione utenti admin:
  - `/api/admin/users`
  - `/api/admin/users/[id]`
  - `/api/admin/users/[id]/toggle`

---

## 14. Variabili ambiente necessarie

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
```

Note:

- `SUPABASE_SERVICE_ROLE_KEY` e sensibile e non va mai esposta sul client; usata in `src/lib/supabase/server.ts` e nel middleware
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` usate anche nel client (`src/lib/supabase/client.ts`)
- `ADMIN_SESSION_SECRET` e prevista nel contesto ma la sessione attuale e basata su token DB + cookie httpOnly (non su JWT firmato)
- Le variabili Supabase sono necessarie anche nel middleware (Edge runtime): il middleware crea il client Supabase direttamente senza passare dal layer `server.ts`

## 15. Configurazione Next.js (next.config.ts)

- `reactCompiler: true` — React Compiler abilitato (via `babel-plugin-react-compiler`)
- `images.remotePatterns`:
  - `https://lh3.googleusercontent.com` — immagini Google (Drive thumbnail)
  - `https://drive.google.com` — file Google Drive
- Plugin: `createNextIntlPlugin` con path `./src/i18n/request.ts`

---

## 16. Convenzioni da rispettare nelle future modifiche

### 16.1 Convenzioni generali

- server components di default
- usare `"use client"` solo dove serve stato, effetti o interazione browser
- mantenere route groups `(main)` e `admin/(dashboard)`
- evitare refactor larghi non richiesti
- mantenere stile Tailwind esistente

### 16.2 Se si tocca l'area pubblica

- preservare supporto IT/AR
- non introdurre stringhe hardcoded dove esistono chiavi `next-intl`
- rispettare `dir="rtl"` per arabo
- mantenere focus ring e accessibilita tastiera

### 16.3 Se si tocca l'area admin

- non rompere la separazione login vs dashboard shell
- non reintrodurre duplicazioni nella dashboard admin
- `Gestione Admin` deve restare condizionale al ruolo superadmin
- il logout deve restare distinto visivamente dai normali link di navigazione

### 16.4 Se si aggiunge un nuovo tipo di contenuto

Passi minimi:

1. aggiungere il tipo in `src/types/index.ts`
2. aggiungere mock data in `src/lib/mock-data.ts` se serve seed
3. aggiungere CRUD in `src/lib/data/store.ts`
4. aggiungere route API admin
5. aggiungere pagina admin di gestione
6. aggiungere pagina pubblica se prevista
7. aggiornare traduzioni IT/AR se visibile sul sito pubblico
8. aggiornare questo file di contesto

---

## 17. Comandi utili di sviluppo

```bash
# sviluppo
npm run dev

# build
npm run build
npm run start

# lint
npm run lint

# typecheck rapido
npx tsc --noEmit

# generare hash bcrypt
npm run generate-hash -- "NuovaPassword"

# Windows: terminare processi node bloccati
taskkill /f /im node.exe

# Windows PowerShell: pulizia build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

Nota pratica:

- se `next dev` fallisce per lock `.next/dev/lock`, di solito c'e gia un'altra istanza del server attiva

---

## 18. Limiti attuali e problemi noti

1. i contenuti del sito non sono persistenti e si resettano al riavvio del server
2. il rate limiter login e in memoria, quindi non e affidabile in multi-istanza/serverless
3. `middleware.ts` crea un client Supabase inline per compatibilita Edge runtime (non usa `supabaseAdmin` da `server.ts`)
4. c'e separazione forte tra auth persistita e contenuti non persistiti: non confondere i due piani
5. evitare modifiche ai token colore gray/slate in `@theme`
6. evitare `zoom` in `globals.css`, ha gia creato problemi di layout in passato
7. `ADMIN_SESSION_SECRET` e dichiarato nelle variabili ma non e ancora usato attivamente (la session security e basata su token UUID in DB + cookie httpOnly)

---

## 19. Roadmap plausibile futura

- migrare i contenuti del sito da store in memoria a Supabase
- upload immagini/file reale e non solo URL
- SEO piu avanzato per pagine dettaglio
- sitemap e metadata per pagine dinamiche
- PWA
- rate limiting centralizzato via Redis
- eventuale auditing permessi admin piu fine-grained

---

## 20. Promemoria finale per una AI che riceve questo file come allegato

Se devi proporre o implementare modifiche su questo progetto, assumi sempre che:

- il codice vero prevale su vecchie descrizioni o assunzioni
- l'area pubblica e bilingue, l'admin no
- la login admin non deve mostrare la shell admin
- la dashboard admin deve offrire informazioni e azioni utili, non duplicare la sidebar
- i contenuti sono live ma non persistenti
- l'autenticazione e persistita su Supabase ed e gia funzionante
- le scelte UI recenti su accessibilita, hover, back links, date localizzate e sidebar i18n sono parte dello stato corretto del progetto e non regressioni da reintrodurre
