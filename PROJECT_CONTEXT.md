# PROJECT_CONTEXT.md - Chiesa di San Marco (Chiesa Copta Ortodossa di Milano)

> Documento di contesto operativo del progetto. Ultimo aggiornamento: 27 giugno 2026.

---

## 1. Scopo del progetto

Sito web bilingue italiano/arabo per la Chiesa Copta Ortodossa di San Marco a Milano.
Il progetto ha due aree principali:

- area pubblica per fedeli e visitatori
- area admin protetta per gestione contenuti e amministratori

Obiettivo pratico del file: fornire a un'altra AI o a un altro sviluppatore il contesto attuale del progetto, incluse architettura, stack, convenzioni, limiti e comportamenti implementati.

---

## 2. Snapshot rapido

| Voce | Valore |
|------|--------|
| Nome progetto | chiesa-san-marco |
| URL dev previsto | http://localhost:3000 |
| Framework | Next.js 16 App Router |
| Lingue | italiano, arabo |
| Frontend pubblico | next-intl + TailwindCSS v4 |
| Root layout | `NextIntlClientProvider`, `AuthProvider`, `LoginModal`, `RegisterModal` |
| Persistenza contenuti | SI, MongoDB Atlas (icone, testi sacri, preghiere, video corsi, eventi, orari, file privati) |
| Persistenza autenticazione | SI, Supabase (admin) + MongoDB (utenti normali) |
| Autenticazione admin | Supabase + `admin_sessions` + cookie `admin_session` |
| Autenticazione utenti normali | MongoDB + cookie `user_session` |
| Registrazione utenti | SI, utenti normali possono registrarsi |
| Iscrizioni eventi | SI, form pubblico + gestione admin (MongoDB `event_registrations`) |
| Accesso ospiti | Sezioni limitate con `GuestGate` |
| Area admin tradotta | No, solo italiano |
| Layer dati attivo | `src/lib/db.ts` → `src/lib/mongo/content.ts` + cache |
| Residui non usati | `src/lib/supabase/content.ts` non referenziato, `src/lib/data/store.ts` fallback locale |

Fatti importanti da sapere subito:

- il sito pubblico e l'area admin condividono lo stesso progetto Next.js
- i contenuti del sito sono persistiti su MongoDB Atlas tramite `src/lib/mongo/content.ts`
- le collezioni MongoDB vuote vengono popolate automaticamente dai mock del primo avvio
- `src/lib/data/store.ts` è un fallback in memoria e non è l'implementazione principale
- l'autenticazione admin è gestita tramite Supabase + tabella `admin_sessions`
- il login unificato in `/api/auth/login` prova prima l'admin Supabase e poi l'utente normale MongoDB
- la route di login admin (`/admin/login`) non deve ereditare sidebar o topbar admin
- la vera shell admin è in `src/app/admin/(dashboard)/layout.tsx`
- la shell pubblica usa `Sidebar` su desktop e una bottom dock mobile, con `Navbar` fissa sopra il contenuto
- il mobile header è stato ottimizzato: il titolo della sezione è centrato e il language switcher è stato compattato per lasciare più spazio all'icona utente quando si è loggati
- la pagina di iscrizioni pubblica (`src/app/(main)/iscrizioni/page.tsx`) fa fetch su `/api/auth/iscrizioni` per gli utenti autenticati; la lista eventi usa `/api/eventi/iscrizione` per inviare le registrazioni
- il redesign grafico recente ha pienamente ridefinito spaziature, palette e componenti mobile-first; il sito ora punta a un layout più arioso e a una user experience coerente tra desktop e mobile
- le iscrizioni eventi includono logica di duplicato/famiglia in `src/lib/mongo/registrations.ts`, con alert specifici per evento esaurito o già registrato

---

## 3. Stack tecnologico reale

Versioni lette da `package.json`:

| Tecnologia | Versione | Uso |
|------------|----------|-----|
| next | 16.1.6 | App Router, server components, middleware |
| react | 19.2.3 | UI |
| react-dom | 19.2.3 | UI runtime |
| typescript | ^5 | tipizzazione |
| tailwindcss | ^4 | styling |
| @tailwindcss/postcss | ^4 | integrazione Tailwind |
| next-intl | ^4.8.3 | i18n IT/AR |
| @supabase/supabase-js | ^2.98.0 | auth e accesso admin |
| mongodb | ^7.1.1 | persistenza contenuti e utenti normali |
| bcryptjs | ^3.0.3 | verifica hash password |
| lucide-react | ^0.575.0 | icone |
| react-qr-code | ^2.0.18 | generazione QR |
| babel-plugin-react-compiler | 1.0.0 | React Compiler |
| dotenv | ^17.3.1 | variabili ambiente negli script |
| eslint | ^9 | lint |
| eslint-config-next | 16.1.6 | configurazione ESLint per Next.js |
| @types/node | ^20 | tipizzazione Node.js |
| @types/react | ^19 | tipizzazione React |
| @types/react-dom | ^19 | tipizzazione React DOM |

Script disponibili:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run generate-hash -- "password"
```

Nota pratica:

- nel parent folder esiste un altro `package-lock.json` che può generare warning di tooling; il progetto corretto è solo `sito-chiesa-san-marco`

---

## 4. Architettura generale

### 4.1 Route groups

Il progetto usa App Router con due route groups principali:

- `(main)` per il sito pubblico
- `admin/(dashboard)` per l'area admin protetta

### 4.2 Layout reali attuali

- `src/app/layout.tsx`
  - root layout globale
  - carica i font `Source Sans 3`, `Cormorant Garamond`, `Noto Naskh Arabic`
  - avvolge l'app con `NextIntlClientProvider`
  - include `AuthProvider`, `LoginModal` e `RegisterModal`
  - imposta `lang`, `dir` e `suppressHydrationWarning`

- `src/app/(main)/layout.tsx`
  - layout pubblico
  - struttura: `Navbar + Sidebar + main content + Footer`
  - `main-shell` riserva spazio per la sidebar desktop e la bottom dock mobile
  - la sidebar pubblica è un dock fisso laterale su desktop

- `src/app/admin/layout.tsx`
  - layout admin base minimale
  - NON contiene sidebar/topbar
  - serve a fare in modo che `/admin/login` non erediti la shell admin

- `src/app/admin/login/layout.tsx`
  - layout centrato per la login admin
  - contenuto centrato con flex e `min-h-screen`

- `src/app/admin/(dashboard)/layout.tsx`
  - vero layout delle pagine admin protette
  - include `AdminSidebar`, topbar fissa, `AdminMobileMenuButton`, `AdminTopbarTitle`, `AdminToast`
  - content area con `lg:ml-[260px]` e `pt-14`
  - header topbar fisso `h-14` con `border-b`

Implicazione importante:

- se si modifica la shell admin, quasi sempre va toccato `src/app/admin/(dashboard)/layout.tsx`, non `src/app/admin/layout.tsx`

---

## 5. Layer dati e persistenza

- `src/lib/db.ts` è la porta principale per i contenuti usati nel sito pubblico e in alcune pagine admin.
- `src/lib/db.ts` chiama `src/lib/mongo/content.ts` e usa `unstable_cache` per caching lato server.
- `src/lib/mongo/content.ts` persiste i contenuti su MongoDB Atlas e popola automaticamente le collezioni vuote dai mock.
- `src/lib/mongo/sessions.ts` gestisce le sessioni utente normali con cookie `user_session`.
- `src/lib/auth/session.ts` gestisce le sessioni admin con cookie `admin_session` e le tabelle Supabase `admin_sessions` / `admin_users`.
- `/api/auth/login` prova prima l'autenticazione admin Supabase e poi l'autenticazione utente normale MongoDB.
- `src/lib/data/store.ts` esiste come fallback in memoria ma non è l'implementazione principale corrente.
- `src/lib/supabase/content.ts` è presente ma non referenziato dalle route attuali; sembra un residuo di un layer dati alternativo.

---

## 6. Struttura directory essenziale

```text
chiesa-san-marco/
|- ADMIN_SETUP.md
|- PROJECT_CONTEXT.md
|- next.config.ts
|- package.json
|- src/
|  |- proxy.ts
|  |- messages/
|  |  |- it.json
|  |  \- ar.json
|  |- i18n/
|  |  \- request.ts
|  |- types/
|  |  \- index.ts
|  |- lib/
|  |  |- mock-data.ts
|  |  |- churches.ts
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
|  |  |- mongo/
|  |  |  |- client.ts
|  |  |  |- content.ts
|  |  |  |- users.ts
|  |  |  |- sessions.ts
|  |  \- supabase/
|  |     |- client.ts
|  |     |- server.ts
|  |     |- schema.sql
|  |     \- content.ts
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
|  |  |- QuickAccessCard.tsx
|  |  |- BackLink.tsx
|  |  |- RelatedResourceCard.tsx
|  |  |- sidebar/
|  |  |  |- SidebarDock.tsx
|  |  |  |- MobileDock.tsx
|  |  |  \- nav-config.ts
|  |  |- auth/
|  |  |  |- AuthContext.tsx
|  |  |  |- LoginModal.tsx
|  |  |  |- RegisterModal.tsx
|  |  |  |- GuestGate.tsx
|  |  |  |- RestrictedSection.tsx
|  |  |  \- UserMenu.tsx
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
|     |  |- contatti/page.tsx
|     |  |- eventi/page.tsx
|     |  |- icone/page.tsx
|     |  |- icone/[slug]/page.tsx
|     |  |- libreria/page.tsx
|     |  |- libreria/[slug]/page.tsx
|     |  |- orari/page.tsx
|     |  |- preghiere/page.tsx
|     |  \- profilo/page.tsx
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
|     |     |- preghiere/page.tsx
|     |     \- utenti/page.tsx
|     \- api/
|        |- eventi/iscrizione/route.ts
|        |- auth/
|        |  |- login/route.ts
|        |  |- logout/route.ts
|        |  |- register/route.ts
|        |  \- me/route.ts
|        \- admin/
|           |- login/route.ts
|           |- logout/route.ts
|           |- eventi/route.ts
|           |- icone/route.ts
|           |- libreria/route.ts
|           |- libreria-privata/route.ts
|           |- orari/route.ts
|           |- preghiere/route.ts
|           |- utenti/route.ts
|           |- richieste-admin/route.ts
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
- `UserRole` — `"credente" | "madre" | "padre" | "ospite_chiesa"`
- `AgeGroup` — `"0-11" | "12-18" | "19-29" | "30-45" | "46-65" | "65+"`
- `AdminRequestStatus` — `"none" | "pending" | "approved" | "rejected"`
- `UserProfile` — profilo utente completo (MongoDB)
- `CreateUserData` — dati per creazione utente
- `UserPublic` — vista pubblica senza password
- `UserSessionInfo` — info utente nel cookie/session client: include ora anche `chiesa?: string`
- `AdminSessionInfo` — info admin nel cookie/session client
- `SessionInfo` — tipo unificato

### 6.1 Dove stanno i dati

- `src/lib/mock-data.ts`
  - seed iniziale del sito
  - contiene icone, testi sacri, preghiere, eventi e orari settimanali
  - usati per popolare MongoDB al primo avvio se le collezioni sono vuote

- `src/lib/mongo/content.ts`
  - layer CRUD dei contenuti su MongoDB Atlas
  - collezioni: `icone`, `testi_sacri`, `preghiere`, `eventi`, `orari_settimanali`, `file_privati`
  - al primo GET su ogni collezione vuota: seed automatico dai mock
  - indici MongoDB creati automaticamente (id, slug, giorno)
  - usato da tutte le API routes admin e da `db.ts`

- `src/lib/data/store.ts`
  - store in-memoria (globalThis) — rimane come fallback di emergenza
  - non più usato direttamente dalle API routes o da db.ts

- `src/lib/db.ts`
  - layer di astrazione async per i server components pubblici
  - legge da `mongo/content.ts`

- `src/lib/actions.ts`
  - server action `setLocale(locale)` per cambiare lingua via cookie (durata 1 anno)

- `src/lib/gdrive.ts`
  - utilita per normalizzare URL Google Drive in link immagine, embed PDF, download
  - funzione principale: `extractGDriveId(url)`

- `src/lib/churches.ts`
  - lista centralizzata delle chiese di provenienza (`CHIESE_LIST`)
  - usata in registrazione, modifica profilo utente e modifica utente in area admin
  - evita duplicazioni e mismatch tra form diversi

### 6.2 Conseguenza pratica fondamentale

I contenuti dell'area pubblica e admin:

- si possono modificare live da pannello admin
- le modifiche **sopravvivono ai riavvii del server** (MongoDB persistente)
- le collezioni vengono popolate dai mock al primo avvio automaticamente

Architettura DB definitiva:

| Dati | Database |
|------|----------|
| Admin auth + sessioni | Supabase |
| Utenti normali + sessioni | MongoDB Atlas |
| Contenuti sito (icone, preghiere, eventi, orari, libreria) | MongoDB Atlas |

---

## 7. Autenticazione admin

L'autenticazione admin e separata dalla gestione contenuti.

### 7.1 Componenti coinvolti

- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/logout/route.ts`
- `src/proxy.ts`
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

`src/proxy.ts`:

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

## 8b. Database MongoDB (utenti normali)

MongoDB viene usato per la persistenza degli utenti normali (non admin) e le loro sessioni.

### 8b.1 Configurazione

- Client singleton in `src/lib/mongo/client.ts` (pattern `globalThis` per HMR safety)
- Variabili ambiente: `MONGODB_URI`, `MONGODB_DB`
- Connessione pooled per performance

### 8b.2 Collezioni

`users`

- `_id` ObjectId (auto)
- `email` string, unique
- `username` string, unique
- `passwordHash` string (bcrypt)
- `nome` string
- `cognome` string
- `role` UserRole (`credente` | `madre` | `padre` | `ospite_chiesa`)
- `ageGroup` AgeGroup (`0-11` | `12-18` | `19-29` | `30-45` | `46-65` | `65+`)
- `chiesa` string (opzionale, per ospiti)
- `attivo` boolean, default true
- `adminRequest` AdminRequestStatus (`none` | `pending` | `approved` | `rejected`)
- `adminRequestDate` Date (opzionale)
- `lastAccess` Date (opzionale)
- `createdAt` Date
- `updatedAt` Date

Indici: unique su `email`, unique su `username`, sparse su `adminRequest`

`user_sessions`

- `_id` ObjectId
- `userId` ObjectId
- `sessionToken` string, unique
- `expiresAt` Date (TTL index, auto-delete dopo scadenza)
- `ipAddress` string (opzionale)
- `userAgent` string (opzionale)
- `createdAt` Date

### 8b.3 CRUD module

File: `src/lib/mongo/users.ts`

Funzioni: `createUser()`, `findUserByEmail()`, `findUserByUsername()`, `findUserById()`, `listUsers()`, `updateUser()`, `updateUserLastAccess()`, `updateAdminRequest()`, `getPendingAdminRequests()`, `deleteUser()`

### 8b.4 Sessions module

File: `src/lib/mongo/sessions.ts`

Funzioni: `createUserSession()`, `validateUserSession()`, `deleteUserSession()`, `deleteAllUserSessions()`, `cleanExpiredUserSessions()`

---

## 8c. Architettura polyglot persistence

Il progetto usa due database per scopi diversi:

| Scopo | Database | Motivo |
|-------|----------|--------|
| Admin auth + sessioni | Supabase (PostgreSQL) | relazionale, gia in uso, RLS |
| Utenti normali + sessioni | MongoDB | schema flessibile, TTL index, rapido prototipo |
| Contenuti sito | MongoDB Atlas | persistenza reale, seed automatico iniziale |

Regola: **admin auth rimane su Supabase, utenti normali su MongoDB**. Non mescolare.

---

## 8d. Autenticazione unificata (utenti + admin)

### 8d.1 Login unificato

Endpoint: `POST /api/auth/login`

Flusso:
1. Riceve `identifier` (email o username) + `password`
2. Tenta prima login admin su Supabase (`tryAdminLogin`)
3. Se non trovato o password errata, tenta login utente su MongoDB (`tryUserLogin`)
4. Se admin: imposta cookie `admin_session`, ritorna `type: "admin"`
5. Se utente: imposta cookie `user_session`, ritorna `type: "user"`
6. Se nessuno: 401

### 8d.2 Registrazione

Endpoint: `POST /api/auth/register`

Due fasi nel modal:
1. **Step 1**: nome, cognome, email, username, password (con conferma)
2. **Step 2 (quiz)**: ruolo, fascia eta, chiesa (se ospite), richiesta admin (opzionale)

Dettaglio implementativo attuale:
- se il ruolo e `ospite_chiesa`, la chiesa di provenienza viene scelta da menu a tendina
- le opzioni provengono da `src/lib/churches.ts` (lista unica condivisa)

Validazione lato server: email/username unici, password min 8 chars, ruolo e ageGroup validi.
Auto-login dopo registrazione.

### 8d.3 Sessione e stato auth

- `GET /api/auth/me` — controlla cookie `admin_session` e `user_session`, ritorna tipo utente
- `POST /api/auth/logout` — elimina sessione utente MongoDB + cookie
- Admin logout resta su `POST /api/admin/logout`

### 8d.4 Auth context client-side

`src/components/auth/AuthContext.tsx`:
- `AuthProvider` avvolge il root layout
- `useAuth()` hook espone: `type` (`guest`/`user`/`admin`), `user`, `admin`, `showLoginModal`, `showRegisterModal`, `isExplicitGuest`, `refresh()`, `logout()`
- `isExplicitGuest` e persistito in localStorage come `explicit_guest`
- `refresh()` controlla prima `admin_info` in localStorage, poi chiama `GET /api/auth/me`
- Quando l'API ritorna `type: "admin"` con dati admin (auto-promozione), salva in localStorage
- `LoginModal` e `RegisterModal` sono renderizzati nel root layout e controllati dal context

### 8d.5 Guest access & restricted sections

- `GuestGate.tsx`: overlay con messaggio + lock icon per contenuti riservati ai registrati
- `RestrictedSection.tsx`: wrapper server-component-compatible
- Attualmente wrappano la griglia libreria e la lista eventi
- Click su GuestGate apre il login modal

### 8d.6 Admin request flow

1. Utente si registra con `adminRequest: "pending"` se seleziona il checkbox
2. Superadmin vede le richieste pendenti in `/admin/gestione-admin`
3. `POST /api/admin/richieste-admin` con `action: "approve"` crea un admin_users in Supabase **con la stessa passwordHash dell'utente** (non piu password temporanea)
4. `action: "reject"` aggiorna lo stato in MongoDB
5. **Auto-promozione**: quando `GET /api/auth/me` rileva un utente con `adminRequest === "approved"` e un corrispondente admin_users in Supabase, crea automaticamente una sessione admin e imposta il cookie `admin_session`. L'utente vede immediatamente l'accesso admin alla prossima navigazione/refresh.
6. L'AuthContext salva i dati admin in localStorage (`admin_info`) quando riceve la promozione via API

### 8d.7 Gestione utenti admin

- `/admin/utenti` — pagina admin per visualizzare/modificare/eliminare utenti normali
- `GET /api/admin/utenti` — lista utenti (richiede `admin.read`)
- `PUT /api/admin/utenti` — modifica utente (richiede `admin.write`)
- `DELETE /api/admin/utenti` — elimina utente (richiede `admin.write`)

Aggiornamento UI (22 apr 2026):
- nel modal di modifica di `/admin/utenti`, quando il ruolo e `ospite_chiesa`, compare il campo `Chiesa di provenienza`
- il campo e un `select` con opzioni da `src/lib/churches.ts`
- cambiando ruolo da `ospite_chiesa` a un ruolo diverso, il campo `chiesa` viene svuotato automaticamente

Bug noto risolto (12 apr 2026): nella pagina `/admin/utenti`, aprendo il modal di modifica di un utente, dopo pochi secondi la lista degli utenti in background scompariva.
Causa: il browser (Chrome/Edge) rileva il campo `type="password"` nel modal (reset password superadmin) e attiva l'autofill, riempiendo il campo `type="text"` piu vicino — ovvero la casella di ricerca — con il username salvato ("admin"). Poiche nessun utente ha "admin" nei propri dati, il filtro restituisce 0 risultati e la lista appare vuota. Chiudere il modal non resetttava la ricerca.
Fix applicato:
  - `autoComplete="off"` sul campo ricerca utenti
  - `autoComplete="new-password"` sul campo password del modal
  - `autoComplete="off"` sui campi nome/cognome del modal
  - honeypot `<input type="text" autoComplete="username" style=display:none readOnly>` prima del campo password

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

**IMPORTANTE: A partire dal 1 maggio 2026, la palette è stata completamente ridisegnata per comunicare una forte identità spirituale e liturgica anziché corporate. Questa revisione grafica include una spaziatura più ariosa, componenti carte più leggibili e una navbar mobile riorganizzata per un'esperienza utente più fluida.**

Token principali (nuova palette):

| Token | Valore | Uso |
|-------|--------|-----|
| `--color-background` | `#FFF9F2` | sfondo generale (crema sofisticata) |
| `--color-foreground` | `#231913` | testo principale (marrone scuro elegante) |
| `--color-primary` | `#0F1A2E` | navy brand (tradizione, stabilita, sacralita) |
| `--color-primary-hover` | `#1E3A5F` | navy hover |
| `--color-primary-light` | `#3D5A47` | sage green (pace, eternita) |
| `--color-accent` | `#B45309` | ambra ricca (illuminazione, benedizione) |
| `--color-accent-light` | `#D97706` | ambra chiara |
| `--color-surface` | `#FFFFFF` | card e superfici principali |
| `--color-surface-alt` | `#FFF3E6` | sfondi alternativi (crema) |
| `--color-surface-2` | `#F4E1CC` | sfondi secondari |
| `--color-border` | `#E7D1B8` | bordi (neutro elegante) |
| `--color-danger` | `#DC2626` | errori e stati critici |
| `--color-success` | `#059669` | successo |
| `--color-warning` | `#D97706` | avvisi |
| `--color-sidebar` | `#231913` | sidebar pubblica e admin |
| `--color-sage` | `#3D5A47` | accenti secondari (pace) |
| `--color-gold` | `#B45309` | accenti primari (ambra) |
| `--color-burgundy` | `#0F1A2E` | colore brand principale (navy heritage) |
| `--font-sans` | `var(--font-inter)` | font principale |

**Razionale della palette finale (1 maggio 2026):**
- Palette definitiva unisce valori spirituali con stabilita visiva
- Navy (#0F1A2E) trasmette tradizione, sacralita, gravitas (mantiene le radici del design originario)
- Ambra (#B45309) comunica illuminazione divina, calore, accoglienza
- Sage green (#3D5A47) simboleggia pace e armonia con l'eternita
- Crema e marrone neutrali assicurano leggibilita e eleganza
- Centralizzazione completa dei colori via CSS variables

Importante:
- La mappatura colori Tailwind è in `tailwind.config.mjs`
- Tutti gli hardcoded colors sono stati sostituiti con token CSS
- Il sistema è facilmente estendibile e manutenibile

### 10.2 Admin

L'area admin utilizza la stessa palette del sito pubblico per coerenza visiva:
- Background navy (#0F1A2E) per sidebar e login
- Accenti ambra (#B45309) per link attivi e hover
- Sage green (#3D5A47) come colore secondario per status indicators
- Palette di neutrali eleganti per UI admin

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
- variabili globali della shell pubblica: `--dock-width`, `--dock-width-compact`, `--dock-bottom-height`, `--topbar-height`, `--topbar-offset`
- `.main-shell` per gestire il padding del layout pubblico in funzione di dock desktop e dock mobile

### 10.4 Font

- font principale: Inter
- definito in root layout con CSS variable `--font-inter`

### 10.5 Footer e dock

- il footer pubblico e stato rifinito con una tinta piu calda e un gradiente leggero per separarlo meglio dal contenuto
- le CTA del footer usano colori piu leggibili e focus ring coerenti con il resto del sito
- il dock laterale usa il fondo scuro del brand, con stato attivo chiaro ad alto contrasto e hover sobrio

---

## 11. Area pubblica: comportamento e UX gia implementati

### 11.1 Layout pubblico

- navbar in alto
- sidebar laterale come dock fisso persistente su desktop
- bottom dock mobile con icone, pensata per non coprire il contenuto critico
- pannello sidebar mobile separato, richiamabile dal bottone menu e dalla bottom dock
- footer sotto il contenuto
- `dir="rtl"` automatico per arabo

### 11.1b Comportamento dock/sidebar

- la sidebar desktop non scorre via con il contenuto: resta ancorata al viewport
- quando la navbar si nasconde nello scroll, la sidebar riallinea automaticamente il proprio offset superiore tramite `html[data-topbar-hidden]`
- la sidebar desktop supporta una modalita compatta persistente salvata in `localStorage` (`dock_compact`)
- la navigazione primaria, le utility e il toggle di compattezza sono separati in zone distinte
- su mobile la bottom dock mostra le destinazioni piu usate e un pulsante menu per aprire il pannello laterale

### 11.2 Pagine pubbliche presenti

- home
- chi siamo
- contatti
- orari
- icone
- icone/[slug]
- libreria
- libreria/[slug]
- eventi
- preghiere
- profilo

### 11.3 Comportamenti importanti gia fatti

- homepage:
  - stat cards cliccabili verso aree rilevanti
  - righe eventi cliccabili
  - righe preghiere cliccabili
  - badge giorno ingranditi e piu leggibili
  - sottotitolo home aggiornato e non generico
  - Quick Access Grid usa componente riutilizzabile `QuickAccessCard`
  - card "Prossima Celebrazione" dinamica con `NextCelebrationCard` (auto-aggiornamento ogni 60s)

- pagine dettaglio icone e libreria:
  - usano `BackLink` componente condiviso per navigazione indietro
  - usano `RelatedResourceCard` per risorse correlate

- pagina eventi:
  - iscrizione con telefono opzionale

---

## 12. Recenti modifiche UI (maggio 2026)

Breve riepilogo delle modifiche recenti al front-end che è importante conoscere per sviluppo e test.

- Footer responsive: su mobile/tablet il footer è stato trasformato in una serie di accordion collassabili per risparmiare spazio verticale; su desktop resta il layout a 4 colonne.
  - File principali: `src/components/Footer.tsx` (aggiornato), `src/components/FooterAccordion.tsx` (nuovo componente client).
  - Comportamento: ogni sezione (Orari, Contatti, Link veloci, Social) è un accordion; la sezione About resta visibile. L'accordion accetta la prop `isLast` per evitare il bordo inferiore sull'ultimo elemento.
  - Scroll intelligente: quando un accordion viene aperto viene eseguito un controllo che calcola il bounding rect del contenuto e, se necessario, scorre la pagina fino a rendere visibile tutto il contenuto.
    - Implementazione: `FooterAccordion` usa `scrollBy({ behavior: 'smooth' })` con un piccolo padding (10px) e un timeout di 50ms per lasciare partire l'animazione di espansione.
    - Nota: se preferisci forzare la visuale fino al fondo dell'accordion (es. `block: 'end'`) posso cambiare il comportamento.

- Separazione client/server: il codice che gestisce l'interattività è stato spostato in `FooterAccordion.tsx` (component client), mentre `Footer.tsx` rimane server component per continuare a usare `getTranslations` e server-side rendering delle stringhe.

- Sidebar mobile — comportamento uniforme con admin:
  - Obiettivo: rendere l'apertura/chiusura della sidebar principale identica a quella del pannello admin.
  - File modificati: `src/components/sidebar/SidebarDock.tsx` (classi CSS e overlay), `src/components/MobileMenuButton.tsx` (toggle delle classi). L'`AdminMobileMenuButton.tsx` rimane come riferimento (toggle classico `-translate-x-full` / `translate-x-0`).
  - Implementazione: la sidebar principale ora usa toggle semplice delle classi CSS (`-translate-x-full`, `translate-x-0`, `opacity-0`, `opacity-100`) e l'overlay usa `pointer-events-none`/`opacity-0` per disabilitare l'interazione quando nascosto. Le transizioni CSS sono coerenti con quelle dell'admin (duration/ timing semplificati a `duration-300 ease-in-out`).

### File aggiunti / modificati

- Aggiunti:
  - `src/components/FooterAccordion.tsx` (nuovo)

- Modificati:
  - `src/components/Footer.tsx` (mobile: accordion, desktop: mantiene griglia a 4 colonne)
  - `src/components/sidebar/SidebarDock.tsx` (toggle/overlay/transition)
  - `src/components/MobileMenuButton.tsx` (toggle classi coerente con admin)
  - `src/components/Footer.tsx` ora utilizza il nuovo `FooterAccordion`

### Come testare velocemente le modifiche

1. Avviare il dev server:
   ```bash
   npm run dev
   ```
2. Aprire il sito e passare alla vista mobile (DevTools). Verificare:
   - Footer: aprire ogni accordion; se l'accordion è parzialmente nascosto, la pagina dovrebbe scorrere automaticamente per mostrarlo tutto.
   - Social: non deve avere una riga di separazione dopo l'ultimo accordion (prop `isLast` impostata).
   - Sidebar mobile: il pulsante menu deve aprire/chiudere la sidebar con la stessa animazione usata nell'admin.

Se vuoi, posso cambiare il padding (attuale 10px) o il delay (attuale 50ms) per adattarlo a dispositivi più lenti: suggerisco provare `padding: 20` o `delay: 120ms` se noti che lo scroll parte troppo presto.

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
  - legenda "Come leggere gli orari" con punti colorati verticali ben spaziati
  - card "Prossima celebrazione" non contiene piu il badge giorno (rimosso per pulizia estetica)
  - colori legenda: navy (#0F1A2E) per orari, amber (#B45309) per elementi evidenziati

- pagina contatti:
  - sezione YouTube dinamica (`YouTubeLiveSection`) con dati dal canale reale (`@SanMarco-Milano`)
  - indicatore live in tempo reale, ultimo video, stream in programma
  - dati YouTube aggiornati ogni 2 minuti lato client, cache server 5 minuti
  - mappa Google Maps embed reale (Via Senato, 4, 20121 Milano MI)
  - cross pin animato sovrapposto alla mappa
  - navbar pubblica fissa in alto con hide/show su direzione scroll (dissolvenza in discesa, riapparizione in risalita)
  - layout pubblico con offset top coerente (`pt-14`) per evitare overlap contenuti sotto navbar fissa
  - dock laterale desktop persistente e bottom dock mobile separata, con comportamento piu stabile sulle pagine lunghe
  - sacerdote: solo nome "Padre Mina Kolta", non contattabile
  - social: solo Facebook (Instagram e WhatsApp rimossi)
  - link Facebook e YouTube reali

- pagina profilo (`/profilo`):
  - mostra info utente: nome, cognome, username, email, ruolo nella comunita, chiesa di provenienza (se ospite)
  - mostra stato richiesta admin (pending/approved/rejected) con badge colorati
  - form per modifica profilo utente normale: nome, cognome, email, username (con controllo unicita), ruolo, fascia eta, chiesa (visibile solo se ruolo = ospite_chiesa)
  - quando il ruolo e `ospite_chiesa`, la chiesa viene scelta da un menu a tendina con opzioni da `src/lib/churches.ts`
  - form per modifica profilo admin: nome, cognome, email (opzionale), username (con controllo unicita) — usa `admin_session`, aggiorna Supabase
  - form per cambio password con validazione (sia utenti normali che admin)
  - sezione "Richiedi accesso admin" per utenti normali
  - accessibile solo utenti autenticati, guest vedono messaggio con link a login
  - Nota implementativa: `POST /api/auth/update-profile` gestisce entrambi i percorsi (user_session = MongoDB, admin_session = Supabase) in base al cookie presente

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
- mostra la sezione `Amministrazione` (solo superadmin) con:
  - `Gestione Utenti` (icona `UsersRound`) → `/admin/utenti`
  - `Gestione Admin` (icona `Users`) → `/admin/gestione-admin`
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
- `/admin/utenti` solo superadmin — gestione utenti normali (MongoDB)

### 12.5 Responsivita admin

Caratteristiche gia implementate:

- hamburger menu sotto breakpoint `lg`
- sidebar che slide-in su mobile
- overlay per chiusura rapida
- topbar fissa
- content area adattata a sidebar desktop
- tabelle admin pensate per scroll orizzontale nelle pagine CRUD

Nota: l'area admin resta separata dalla nuova shell pubblica e non usa il dock laterale ispirato a Webflow University.

---

## 13. API esistenti

### 13.1 API pubblica

- `POST /api/eventi/iscrizione`
- `POST /api/auth/login` — login unificato (admin + utenti)
- `POST /api/auth/register` — registrazione utenti normali
- `POST /api/auth/logout` — logout utenti normali
- `GET /api/auth/me` — stato sessione corrente (con auto-promozione admin se approved)
- `POST /api/auth/change-password` — cambio password utente autenticato (accetta sia `user_session` che `admin_session`)
- `POST /api/auth/update-profile` — aggiornamento profilo; biforcato in due percorsi:
  - **utente normale** (`user_session`): aggiorna nome, cognome, email (unicita), username (unicita), role, ageGroup, chiesa
  - **admin** (`admin_session`): aggiorna nome, cognome, email (unicita), username (unicita) in Supabase; il client aggiorna localStorage ed esegue `refresh()`
- `GET /api/youtube/channel` — dati canale YouTube (cache 5 min, richiede `YOUTUBE_API_KEY`)

### 13.3 Rendering/caching pagine pubbliche

Le principali pagine pubbliche usano ISR con `revalidate = 60` (invece di `force-dynamic`) per ridurre il delay percepito in apertura sezione e mantenere aggiornamento frequente dei contenuti.

Ottimizzazioni performance navigazione introdotte (23 apr 2026):

- `src/lib/db.ts` usa cache server (`unstable_cache`) per liste e dettagli contenuti (icone, libreria, preghiere, eventi, orari) con `revalidate: 60`
- le principali pagine pubbliche hanno fetch in parallelo (`Promise.all`) invece di catena sequenziale
- aggiunto `src/app/(main)/loading.tsx` per feedback immediato durante i cambi pagina nel route group pubblico
- invalidazione cache puntuale dopo CRUD admin contenuti (`/api/admin/libreria`, `/api/admin/icone`, `/api/admin/preghiere`, `/api/admin/eventi`, `/api/admin/orari`) tramite `revalidateTag`
- fix runtime su `/admin/libreria-privata`: la route ora attende davvero i risultati MongoDB prima di serializzarli, evitando errori tipo `files.map is not a function`
- la shell pubblica ora dipende anche dallo stato della navbar che si nasconde su scroll, quindi i cambi di layout vanno verificati in combinazione con il comportamento del dock

Obiettivo pratico: transizioni tra sezioni piu rapide e meno effetto "connessione lenta" percepita dall'utente.

### 13.2 API admin

- `POST /api/admin/login` — (legacy, usato dal middleware)
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
- gestione utenti normali:
  - `/api/admin/utenti` (GET/PUT/DELETE)
- richieste admin:
  - `/api/admin/richieste-admin` (GET/POST)

---

## 14. Variabili ambiente necessarie

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
MONGODB_URI=
MONGODB_DB=
YOUTUBE_API_KEY=
```

Note:

- `SUPABASE_SERVICE_ROLE_KEY` e sensibile e non va mai esposta sul client; usata in `src/lib/supabase/server.ts` e nel middleware
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` usate anche nel client (`src/lib/supabase/client.ts`)
- `ADMIN_SESSION_SECRET` e prevista nel contesto ma la sessione attuale e basata su token DB + cookie httpOnly (non su JWT firmato)
- `MONGODB_URI` e la connection string MongoDB (es. `mongodb://localhost:27017` o Atlas URL)
- `MONGODB_DB` e il nome del database (es. `chiesa-san-marco`)
- `YOUTUBE_API_KEY` chiave YouTube Data API v3 per il recupero dinamico dei dati del canale (opzionale, se assente la sezione mostra dati statici)
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

## 24. Integrazione della visibilità nelle pagine pubbliche (14 maggio 2026)

### 24.1 Nuovo sistema: SectionVisibilityGate

Partendo dal sistema di gestione della visibilità creato in precedenza (sezione 23), è stato aggiunto un controllo della visibilità anche a livello delle pagine pubbliche. Quando un admin imposta una sezione come "coming_soon", i visitatori vedono una pagina di "In Arrivo" anziché il contenuto.

**File nuovo principale:**

- `src/lib/section-access.ts` — funzioni utility server-side per verificare l'accesso
  - `getUserRoleServer()` — determina il ruolo dell'utente dal cookie `user_session` (lato server)
  - `getSectionAccess(sectionId)` — ritorna il livello di accesso ("full", "coming_soon", "hidden")

- `src/components/SectionVisibilityGate.tsx` — server component che wrappa il contenuto delle pagine
  - Verifica l'accesso alla sezione
  - Mostra il contenuto normale se accesso è "full"
  - Mostra ComingSoonPage se accesso è "coming_soon"
  - Mostra messaggio di accesso negato se accesso è "hidden"

**Estensione in `src/lib/mongo/sessions.ts`:**

- `getUserFromSessionToken(sessionToken)` — funzione helper che:
  - Valida la sessione utente
  - Recupera l'utente associato da MongoDB
  - Ritorna userId e role

### 24.2 Pagine pubbliche aggiornate

Le seguenti pagine sono state avvolte con `SectionVisibilityGate` per applicare il controllo della visibilità:

- `src/app/(main)/eventi/page.tsx` — sectionId: "eventi"
- `src/app/(main)/icone/page.tsx` — sectionId: "icone"
- `src/app/(main)/libreria/page.tsx` — sectionId: "libreria"
- `src/app/(main)/orari/page.tsx` — sectionId: "orari"
- `src/app/(main)/preghiere/page.tsx` — sectionId: "preghiere"

**Struttura del wrapper (esempio - pagina eventi):**

```tsx
<SectionVisibilityGate sectionId="eventi" title={t("titolo")}>
  <AdminGate title={t("titolo")}>
    {content}
  </AdminGate>
</SectionVisibilityGate>
```

Il gate è avvolto attorno a `AdminGate` (quando presente) o direttamente attorno al contenuto (quando assente).

### 24.3 Flusso di autenticazione lato server

Quando una pagina pubblica viene caricata:

1. Il server component `SectionVisibilityGate` chiama `getSectionAccess(sectionId)`
2. `getSectionAccess()` legge il cookie `user_session` dal client
3. Se il cookie esiste, chiama `getUserFromSessionToken(sessionToken)` che:
   - Valida la sessione in MongoDB (`user_sessions` collection)
   - Recupera l'utente completo da MongoDB (`users` collection)
   - Ritorna userId e role
4. Se il cookie non esiste (guest), ritorna "guest" come ruolo
5. Chiama `getRoleAccessToSection(sectionId, role)` per verificare i permessi in MongoDB
6. Ritorna l'accesso ("full", "coming_soon", "hidden")

### 24.4 Comportamento visuale per il visitatore

**Utente guest (non autenticato):**

- Vede le sezioni configurate come "full" per il ruolo "guest"
- Se una sezione è "coming_soon" per guest, vede il messaggio di "In Arrivo"
- Se una sezione è "hidden" per guest, vede il messaggio di "Accesso Negato"

**Utente autenticato (es. ruolo "credente"):**

- Vede le sezioni configurate come "full" per il suo ruolo specifico
- Se una sezione è "coming_soon" per il suo ruolo, vede il messaggio di "In Arrivo"
- Se una sezione è "hidden" per il suo ruolo, vede il messaggio di "Accesso Negato"

### 24.5 Configurazione di default

Nel file `src/lib/mongo/visibility.ts`, la configurazione di default è:

| Sezione | Guest | Credente | Madre | Padre | Ospite Chiesa | Admin | SuperAdmin |
|---------|-------|----------|-------|-------|---------------|-------|------------|
| orari | full | full | full | full | full | full | full |
| preghiere | full | full | full | full | full | full | full |
| icone | full | full | full | full | full | full | full |
| libreria | coming_soon | full | full | full | full | full | full |
| eventi | coming_soon | full | full | full | full | full | full |
| video-corsi | coming_soon | full | full | full | full | full | full |

**Significato pratico**: I guest vedono "In Arrivo" per libreria, eventi e video-corsi, mentre gli utenti autenticati hanno accesso completo.

### 24.6 API pubblica per il caricamento della visibilità

La sidebar client-side (`SidebarDock.tsx`) continua a usare l'endpoint pubblico:

- `GET /api/public/section-visibility` — ritorna tutte le configurazioni di visibilità per il caricamento lato client

Questo endpoint è già stato creato e funziona correttamente. È usato dal componente SidebarDock per nascondere i link delle sezioni nella navigazione laterale se non accessibili all'utente corrente.

### 24.7 Integrazione con il sistema di visibilità admin

Il sistema è completamente integrato con i pannelli di gestione admin:

- `/admin/gestione-sezioni` — admin e superadmin possono toggle `isActive` per ogni sezione (nasconde completamente la sezione per tutti)
- `/admin/gestione-permessi` — superadmin possono configurare i permessi per ruolo e impostare "coming_soon" per sezioni in preparazione

Quando un superadmin:
1. Va su `/admin/gestione-permessi`
2. Imposta una sezione (es. "libreria") come "coming_soon" per il ruolo "guest"
3. Salva la configurazione
4. Un visitatore guest che accede a `/libreria` vede il messaggio "In Arrivo" anziché il contenuto

### 24.8 Avvertenze e limiti

- Le pagine pubbliche controllano la visibilità **lato server**, garantendo sicurezza (non è aggirata da client)
- Se un utente conosce direttamente l'URL (es. `/libreria/[slug]`), il controllo viene applicato a livello della pagina container (es. `/libreria`)
- Le pagine di dettaglio (icone/[slug], libreria/[slug]) non hanno controlli separati; ereditano il comportamento dalla pagina container
- Il sistema assume che il ruolo sia sempre presente nel token sessione; se assente, di default nega accesso ("hidden")
- In caso di errore nel caricamento della visibilità da MongoDB, il fallback è "full" (accesso consentito) per garantire che il sito rimanga consultabile in caso di problemi al database

### 24.9 Testing della funzionalità

Per verificare che il sistema funzioni correttamente:

**Come ospite (guest):**
1. Apri un browser privato/incognito
2. Accedi a `http://localhost:3000/eventi`
3. Dovresti vedere il messaggio "In Arrivo" (secondo la configurazione di default)

**Come utente autenticato:**
1. Accedi alla login con un account utente (es. ruolo "credente")
2. Accedi a `http://localhost:3000/eventi`
3. Dovresti vedere la lista degli eventi normalmente

**Come superadmin per cambiare la configurazione:**
1. Accedi come superadmin
2. Vai a `/admin/gestione-permessi`
3. Modifica lo stato della sezione "eventi" per il ruolo "guest" da "coming_soon" a "full"
4. Salva
5. Accedi come guest (browser privato) a `/eventi`
6. Ora dovresti vedere il contenuto normale

---

## 25. Limiti attuali e problemi noti

1. la shell pubblica usa logiche client-side (navbar hide/show e menu mobile), quindi eventuali modifiche su scroll/overlay vanno testate bene su mobile e desktop
2. il rate limiter login e in memoria, quindi non e affidabile in multi-istanza/serverless
3. `src/proxy.ts` crea un client Supabase inline per compatibilita Edge runtime (non usa `supabaseAdmin` da `server.ts`)
4. c'e separazione forte tra auth admin (Supabase) e auth utenti normali (MongoDB): non confondere i due piani
5. evitare modifiche ai token colore gray/slate in `@theme`
6. evitare `zoom` in `globals.css`, ha gia creato problemi di layout in passato
7. `ADMIN_SESSION_SECRET` e dichiarato nelle variabili ma non e ancora usato attivamente (la session security e basata su token UUID in DB + cookie httpOnly)
8. il middleware protegge solo le route admin; le route `/api/auth/*` sono pubbliche
9. quando un utente viene approvato come admin, le stesse credenziali di login funzionano per l'accesso admin (non serve piu password temporanea)
10. la shell pubblica e in fase di rifinitura continua: i file chiave del dock sono `src/components/sidebar/SidebarDock.tsx`, `src/components/sidebar/MobileDock.tsx` e `src/components/sidebar/nav-config.ts`
11. il dock compatto desktop e persistito con `localStorage` (`dock_compact`), quindi ogni modifica va controllata sia in stato esteso sia in stato compatto

---

## 26. Roadmap plausibile futura

- migrare i contenuti del sito da store in memoria a Supabase
- upload immagini/file reale e non solo URL
- SEO piu avanzato per pagine dettaglio
- sitemap e metadata per pagine dinamiche
- PWA
- rate limiting centralizzato via Redis
- eventuale auditing permessi admin piu fine-grained

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

1. la shell pubblica usa logiche client-side (navbar hide/show e menu mobile), quindi eventuali modifiche su scroll/overlay vanno testate bene su mobile e desktop
2. il rate limiter login e in memoria, quindi non e affidabile in multi-istanza/serverless
3. `src/proxy.ts` crea un client Supabase inline per compatibilita Edge runtime (non usa `supabaseAdmin` da `server.ts`)
4. c'e separazione forte tra auth admin (Supabase) e auth utenti normali (MongoDB): non confondere i due piani
5. evitare modifiche ai token colore gray/slate in `@theme`
6. evitare `zoom` in `globals.css`, ha gia creato problemi di layout in passato
7. `ADMIN_SESSION_SECRET` e dichiarato nelle variabili ma non e ancora usato attivamente (la session security e basata su token UUID in DB + cookie httpOnly)
8. il middleware protegge solo le route admin; le route `/api/auth/*` sono pubbliche
9. quando un utente viene approvato come admin, le stesse credenziali di login funzionano per l'accesso admin (non serve piu password temporanea)
10. la shell pubblica e in fase di rifinitura continua: i file chiave del dock sono `src/components/sidebar/SidebarDock.tsx`, `src/components/sidebar/MobileDock.tsx` e `src/components/sidebar/nav-config.ts`
11. il dock compatto desktop e persistito con `localStorage` (`dock_compact`), quindi ogni modifica va controllata sia in stato esteso sia in stato compatto

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
- i contenuti sono live e persistenti su MongoDB Atlas
- l'autenticazione admin e persistita su Supabase, quella utenti normali su MongoDB
- il login e unificato: un singolo modal/endpoint gestisce sia admin che utenti
- gli utenti normali possono richiedere di diventare admin (approvazione da superadmin)
- le sezioni riservate (libreria, eventi) sono limitate ai guest tramite GuestGate
- la lista chiese per `ospite_chiesa` e centralizzata in `src/lib/churches.ts` e va riusata ovunque
- le scelte UI recenti su accessibilita, hover, back links, date localizzate e sidebar i18n sono parte dello stato corretto del progetto e non regressioni da reintrodurre
- i componenti riutilizzabili (QuickAccessCard, BackLink, RelatedResourceCard) vanno usati dove possibile

---

## 21. Redesign cromatico radicale (1 maggio 2026)

### 21.1 Problemi della palette precedente

- **Navy (#1E3A5F) + Bright Blue (#2563EB)**: due famiglie blu incoerenti senza una chiara identità
- **Ambra (#B45309)**: non comunica bene importanza e sacralità, tono troppo "artigianale"
- **Tono generale**: aziendale/tech anziché spirituale-liturgico
- **Gerarchia visiva**: scarsa tra colori primari, troppi colori piatti
- **Mancava profondità**: identità chiara e dignità estetica insufficienti
- **Colori hardcoded sparsi**: difficili da mantenere e non coerenti

### 21.2 Nuova direzione: "Palazzo Liturgico"

Palette completamente ripensata per riflettere l'identità vera della Chiesa Copta Ortodossa di San Marco:

| Colore | Valore | Ruolo | Significato |
|--------|--------|-------|------------|
| **Burgundy Plum** | #5E2436 | Primary | Profondità, sacralità, tradizione millenaria |
| **Oro** | #D8B04F | Accent | Illuminazione divina, benedizione, elemento liturgico |
| **Sage Green** | #2F6A4F | Secondary | Pace, eternità, vita eterna |
| **Crema Calda** | #FFF9F2 | Background | Purezza, serenità, eleganza |
| **Marrone Scuro** | #231913 | Text | Dignità, serietà, leggibilità |

### 21.3 Trasformazioni implementate

**File principali aggiornati:**
1. `src/app/globals.css` — sostituzione token `@theme`
2. `tailwind.config.mjs` — creazione mappatura CSS variables
3. Eliminazione di **50+ colori hardcoded** in:
   - `src/components/admin/AdminSidebar.tsx` — navy → burgundy, amber → gold
   - `src/app/admin/login/layout.tsx` — navy → primary
   - `src/app/admin/login/page.tsx` — tutti gli amber → gold
   - `src/components/auth/LoginModal.tsx` — navy → primary
   - `src/components/auth/RegisterModal.tsx` — navy → primary, select options
   - `src/components/auth/UserMenu.tsx` — amber → gold
   - `src/components/auth/GuestGate.tsx` — amber → gold
   - `src/components/BackLink.tsx` — amber hover → gold hover
   - `src/components/IconeGrid.tsx` — amber hover → gold hover
   - `src/components/YouTubeLiveSection.tsx` — navy → burgundy
   - `src/components/admin/AdminTopbarTitle.tsx` — amber icon → gold
   - `src/app/(main)/profilo/page.tsx` — ~20 occorrenze amber → gold

**Centralizzazione:**
- Da ~50 colori scattered a **18 token unificati** via CSS variables
- Tailwind config centralizzato in `tailwind.config.mjs`
- Focus rings, borders, shadows adattati alla nuova palette

### 21.4 Risultato visivo

**Identità:** Forte, riconoscibile, coerente
**Comunicazione:** Spiritualità, tradizione, accoglienza, comunità
**Estetica:** Profondità, lusso consapevole, eleganza discreta
**Accessibilità:** Contrasto migliorato, focus ring gold ben visibile
**Manutenibilità:** Sistema completamente estendibile e gestibile centralmente

---

## 22. Modifiche UI/UX recenti (8 maggio 2026)

### 21.1 Fix navbar e background

**Problema**: quando la pagina non veniva scrollata, la parte sotto la navbar trasparente mostrava uno sfondo grigio scuro.

**Soluzione**: Modificato `src/app/(main)/layout.tsx` — cambiato il background della div wrapper da `bg-sidebar` a `bg-background` per mantenere sfondo bianco coerente anche quando la navbar è trasparente.

### 21.2 Redesign homepage — da app-like a sito web professionale

**Obiettivo**: trasformare la home page da aesthetic mobile app a sito web professionale e sobrio.

**Modifiche per sezione**:

- **Zona 1 (Welcome header)**
  - Prima: gradiente blu full-width, titolo bianco uppercase
  - Dopo: titolo nero (h1), sottotitolo grigio (p), divider gold slim
  
- **Zona 2 (Quick Access Grid)**
  - Aggiunto heading "Accesso rapido"
  - Grid responsivo 1/2/3 colonne (mobile/tablet/desktop)
  - Gap aumentato (`gap-4 sm:gap-5`)

- **Zona 3 (Consigliato per te, ex "Da fare")**
  - Layout: da verticale diviso a grid 2 colonne (sm+)
  - Card: sfondo bianco, bordi gray-200, shadow sm→md hover
  - Icons: in background `w-11 h-11 bg-accent/10 rounded-lg`
  - Pulsanti action inline con hover color transition

- **Zona 4 (Statistiche)**
  - Aggiunto heading "Statistiche"
  - Card: bordi `rounded-2xl`, shadow sm/md, background bianco

- **Zona 5 (Contenuti in primo piano)**
  - Aggiunto heading "Contenuti in primo piano"
  - Card: bordi `rounded-2xl`, shadow sm/md

### 21.3 Componenti aggiornati

**QuickAccessCard** (`src/components/QuickAccessCard.tsx`):
- Background: `bg-white` (was `bg-slate-800`)
- Bordi: `border-2 border-accent` o `border border-gray-200`
- Testo: `text-gray-900` (was `text-white`)
- Icons: in background con `bg-accent/10`
- Border radius: `rounded-2xl` (was `rounded-xl`)
- Shadow: `shadow-md hover:shadow-lg`

**NextCelebrationCard** (`src/components/NextCelebrationCard.tsx`):
- Background: `bg-gradient-to-br from-accent/5 to-accent/10` (was `bg-slate-800`)
- Testo: `text-gray-900` (was `text-white`)
- Icon background: `bg-accent/20`
- Border radius: `rounded-2xl`

### 21.4 Vantaggi del nuovo design

- Più web-like, meno mobile app
- Contrast/leggibilità migliorata
- Mobile-first responsive: grid 1 col → 2 col su sm
- Accessibilità: ratio text/bg migliore
- Consistenza: `rounded-2xl`, `shadow-sm/md`, `border-gray-200` uniforme

### 22.3 Shell pubblica e footer aggiornati (8 maggio 2026)

- introdotto un dock laterale fisso desktop ispirato a Webflow University, con gerarchia visiva separata tra navigazione primaria, utility e toggle di compattezza
- introdotta una bottom dock mobile coerente con la sidebar desktop, per mantenere continuita visiva e funzionale sui piccoli schermi
- la navbar pubblica continua a nascondersi su scroll e ora comunica il proprio stato alla sidebar tramite `html[data-topbar-hidden]`
- il logo e stato rimosso dalla sidebar per evitare ridondanza con la navbar, lasciando il brand solo nell'header superiore
- il footer e stato ripulito cromaticamente con CTA piu chiare e contrasto migliore sui link, per evitare l'effetto troppo spento della versione precedente

### 22.4 Migliorie navbar/sidebar/home/orari + dashboard (8 maggio 2026)

- Navbar mobile: layout a 3 colonne con titolo centrale troncato e spaziature piu stabili (Navbar.tsx, TopbarTitle.tsx)
- Sidebar mobile: overlay con fade + easing piu morbido, scroll interno stabilizzato, sottotitoli attivi leggibili e spaziature uniformate (SidebarDock.tsx, MobileDock.tsx, MobileMenuButton.tsx)
- Home mobile: hero full-height con indicatore scroll animato e chiave i18n `home.scrollHint` (page.tsx, globals.css, messages/it.json, messages/ar.json)
- Orari: cards mobile piu leggibili; evidenzia solo la prossima celebrazione (giorno + riga) anche su desktop (OrariTable.tsx)
- Dashboard admin: conteggi e box "Oggi" ora letti dal layer MongoDB contenuti; file privati da Mongo (admin/(dashboard)/page.tsx)

### 22.5 Orari settimanali normalizzati (12 maggio 2026)

- il layer contenuti Mongo ordina sempre gli orari nella sequenza canonica Domenica → Sabato, cosi la tabella pubblica e la vista admin non dipendono piu dall'ordine fisico dei documenti nel database (src/lib/mongo/content.ts)
- la normalizzazione viene applicata anche ai ritorni di create/update degli orari, per mantenere coerente l'output API dopo modifiche admin

---

## 23. Gestione della visibilità delle sezioni e bug corretti (14 maggio 2026)

### 23.1 Sistema di visibilità delle sezioni

Il sito implementa un sistema di gestione della visibilità per le sezioni, permettendo ai superadmin di controllare chi può accedere a ogni sezione (icone, libreria, eventi, preghiere, etc.) e come visualizzarla.

**Componenti principali:**

- `src/lib/mongo/visibility.ts` — layer MongoDB per la gestione della visibilità
  - Collezione: `section_visibility` (seeding automatico con DEFAULT_SECTIONS)
  - Funzioni: `getAllSectionVisibilities()`, `getSectionVisibility()`, `updateSectionActive()`, `updateSectionRoleConfig()`, `getRoleAccessToSection()`

- `src/components/admin/AdminSectionVisibilityManager.tsx` — componente per admin
  - Toggle semplice on/off per attivare/disattivare una sezione
  - Usa `/api/admin/section-visibility/[sectionId]` con `PUT { isActive }`

- `src/components/admin/SuperAdminSectionVisibilityManager.tsx` — componente per superadmin
  - Matrice di controllo permessi: ruoli × accessi (full/coming_soon/hidden)
  - Permette configurazione granulare per ruolo

- `src/components/sidebar/SidebarDock.tsx` — integrazione nella navbar pubblica
  - Carica visibilità dal server al mount
  - Applica `getAccessForSection()` per determinare se mostrare un link
  - Support per coming_soon (badge "Soon" grigio)

**Pagine admin correlate:**

- `/admin/gestione-sezioni` — gestione semplice (admin + superadmin)
- `/admin/gestione-permessi` — gestione avanzata permessi per ruolo (solo superadmin)

### 23.2 Bug corretti (14 maggio 2026)

#### Bug #1: roleConfig sostituito anziché mergiato

**Problema**: Quando il superadmin cambiava l'accesso di un ruolo (es. `credente: "full"` → `credente: "coming_soon"`), il payload inviato era:
```json
{ "roleConfig": { "credente": "coming_soon" } }
```

La funzione MongoDB `updateSectionRoleConfig()` usava `$set: { roleConfig, ... }`, che **sostituiva completamente** il roleConfig, perdendo tutte le altre configurazioni di ruoli precedentemente salvate.

**Fix applicato** in `src/lib/mongo/visibility.ts`:
- Aggiunto merge del roleConfig: legge il documento attuale, combina la nuova config con quella esistente
- Usa spread operator per il merge: `{ ...current.roleConfig, ...roleConfig }`

**File modificato**: `src/lib/mongo/visibility.ts` — funzione `updateSectionRoleConfig()`

#### Bug #2: Componente invia configurazione incompleta

**Problema**: Il componente `SuperAdminSectionVisibilityManager.tsx` inviava solo il ruolo selezionato senza gli altri dati:
```json
{ "roleConfig": { "credente": "full" } }
```

Anche se il server faceva il merge, era comunque inefficiente e potrebbe creare inconsistenze.

**Fix applicato** in `src/components/admin/SuperAdminSectionVisibilityManager.tsx`:
- Nel handler `handleAccessChange()`, prima di inviare la richiesta:
  - Legge la sezione attuale dallo stato locale
  - Crea la nuova configurazione mergiata sul client
  - Invia il `roleConfig` completo con tutti i ruoli

**File modificato**: `src/components/admin/SuperAdminSectionVisibilityManager.tsx` — funzione `handleAccessChange()`

#### Bug #3: Logica ambigua nella route API PUT

**Problema**: La route `PUT /api/admin/section-visibility/[sectionId]` aveva tre branch che potevano sovrapporsi:
1. Se `isActive` definito e `roleConfig` no → `updateSectionActive()`
2. Se `roleConfig` definito → `updateSectionRoleConfig()`
3. Se almeno uno dei tre (isActive, sectionLabel, roleConfig) definito → `updateSectionVisibility()`

La terza condizione poteva essere vera anche quando le prime due erano vere, causando double-update.

**Fix applicato** in `src/app/api/admin/section-visibility/[sectionId]/route.ts`:
- Rresa esplicita la logica con check piu stretti
- Prima condizione: `isActive !== undefined && roleConfig === undefined && sectionLabel === undefined` (true toggle)
- Seconda condizione: `roleConfig !== undefined` (permessi)
- Terza condizione: `sectionLabel !== undefined || isActive !== undefined` (aggiornamento completo, solo se non roleConfig)

**File modificato**: `src/app/api/admin/section-visibility/[sectionId]/route.ts` — funzione `PUT()`

#### Bug #4: Fallback assente per ruoli non configurati

**Problema**: Nel componente `SuperAdminSectionVisibilityManager`, quando un ruolo non aveva una configurazione nel `roleConfig`, la riga del ruolo non mostrava nessun pulsante selezionato (tutti gli accessi apparivano deselezionati).

**Fix applicato** in `src/components/admin/SuperAdminSectionVisibilityManager.tsx`:
- Aggiunto fallback a `"hidden"` quando il ruolo non è nel roleConfig
- `const currentAccess = section.roleConfig[role as keyof typeof section.roleConfig] || "hidden";`

**File modificato**: `src/components/admin/SuperAdminSectionVisibilityManager.tsx` — rendering della matrice permessi

#### Bug #5: Messaggi di errore poco informativi

**Problema**: Nel componente `AdminSectionVisibilityManager`, i messaggi di errore non davano informazioni utili per il debug.

**Fix applicato** in `src/components/admin/AdminSectionVisibilityManager.tsx`:
- Aggiunto logging nella console per errori
- Messaggi di successo più descrittivi: `"Sezione attivata!"` vs `"Sezione disattivata!"`
- Error display include `data.error` del server se disponibile

**File modificato**: `src/components/admin/AdminSectionVisibilityManager.tsx` — funzione `handleToggle()`

### 23.3 Come funziona il sistema di visibilità

1. **Caricamento iniziale**: Le sezioni e la loro configurazione vengono caricate da MongoDB al primo accesso via `getAllSectionVisibilities()`

2. **Seeding automatico**: Se la collezione è vuota, viene auto-populata con `DEFAULT_SECTIONS` (tutte le sezioni hanno accesso "full" o "coming_soon" per default)

3. **Amministrazione**:
   - Admin possono toggle `isActive` per ogni sezione (on/off globale)
   - Superadmin possono configurare `roleConfig` per ogni ruolo

4. **Integrazione pubblica**:
   - Il componente `SidebarDock` carica le visibilità al mount
   - Per ogni link della sidebar, calcola `getAccessForSection(sectionId, userRole)`
   - Se `isActive === false` → non renderizza il link
   - Se `roleConfig[userRole] === "hidden"` → non renderizza il link
   - Se `roleConfig[userRole] === "coming_soon"` → renderizza con badge "Soon"

5. **Persistenza**: Tutte le modifiche sono salvate immediatamente in MongoDB via API `PUT`, nessun cache da invalidare

### 23.4 Note di implementazione

- Il layer MongoDB fa automaticamente il merge dei permessi (non sostituisce)
- Il componente client costruisce il payload completo prima di inviare al server
- La logica del server è stata resa esplicita per evitare branch overlapping
- Tutti i ruoli possibili (guest, credente, madre, padre, ospite_chiesa, admin, superadmin) sono sempre presenti nel DEFAULT_SECTIONS
- Non ci sono problemi di cache: le visibilità vengono sempre lette fresh dal client al mount di SidebarDock

### 23.5 Testing del sistema

Passi per verificare che i bug siano risolti:

1. **Test Bug #1/2**: Vai a `/admin/gestione-permessi`, seleziona una sezione, cambia il permesso di un ruolo (es. credente → coming_soon), verifica che gli altri ruoli rimangano invariati

2. **Test Bug #3**: Cambia rapidamente l'accesso di ruoli diversi nella stessa sezione senza aspettare, verifica che ogni cambio sia registrato correttamente

3. **Test Bug #4**: Se nessun ruolo ha una configurazione iniziale, verifica che la matrice mostri tutti i pulsanti (tutti grigi per default)

4. **Test Bug #5**: Cambia l'accesso a una sezione e guarda la console browser; dovrebbe mostrare successo/errore con dettagli

---
