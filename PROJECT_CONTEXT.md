# PROJECT_CONTEXT.md - Chiesa di San Marco (Chiesa Copta Ortodossa di Milano)

> Documento di contesto operativo del progetto. Questa versione riflette lo stato reale del repository nel workspace: contenuti pubblici letti da MongoDB, area admin protetta, supporto bilingue italiano/arabo e nessun seed demo automatico nei layer dati.

---

## 1. Scopo del progetto

Il progetto è il sito web ufficiale della Chiesa Copta Ortodossa di San Marco a Milano. Il sito unisce:

- una parte pubblica per fedeli, visitatori e famiglie della comunità
- un'area admin protetta per creare, aggiornare e pubblicare contenuti

L'architettura è orientata al rendering server-side di Next.js e separa chiaramente:

- autenticazione utenti normali e amministratori
- contenuti pubblici e contenuti riservati
- visibilità delle sezioni e protezione di alcune pagine

Il documento serve come fotografia aggiornata del codice presente nel repository, con particolare attenzione a route, layout, data layer, auth flow e struttura delle cartelle.

---

## 2. Snapshot rapido

| Voce | Valore |
|---|---|
| Nome progetto | `chiesa-san-marco` |
| URL sviluppo | `http://localhost:3000` |
| Framework | Next.js 16.1.6 con App Router |
| UI runtime | React 19.2.3 / React DOM 19.2.3 |
| Linguaggio | TypeScript |
| Styling | Tailwind CSS 4 |
| i18n | `next-intl` 4.8.3 |
| Lingue | italiano, arabo |
| Contenuti pubblici | MongoDB |
| Iscrizioni eventi | MongoDB |
| Admin users | Supabase |
| Sessioni | JWT cookie lato server |
| Login pubblico | `/api/auth/login` |
| Login admin | `/admin/login` e `/api/admin/login` |
| Sezioni protette | `eventi`, `icone`, `libreria`, `orari`, `preghiere`, `video-corsi` |
| Stato seed contenuti | nessun mock seed automatico; le collezioni partono vuote |
| File mock demo | `src/lib/mock-data.ts` rimosso dal flusso applicativo |

---

## 3. Stack tecnologico reale

Dipendenze principali lette da `package.json`:

| Tecnologia | Versione | Ruolo |
|---|---:|---|
| `next` | 16.1.6 | Framework, App Router, API routes |
| `react` | 19.2.3 | UI |
| `react-dom` | 19.2.3 | Runtime React |
| `typescript` | ^5 | Tipizzazione |
| `tailwindcss` | ^4 | Styling utility-first |
| `@tailwindcss/postcss` | ^4 | Integrazione PostCSS |
| `next-intl` | ^4.8.3 | Traduzioni IT/AR |
| `mongodb` | ^7.1.1 | Database contenuti, utenti, sessioni, iscrizioni |
| `@supabase/supabase-js` | ^2.98.0 | Layer admin e residui compatibili |
| `bcryptjs` | ^3.0.3 | Hash password |
| `lucide-react` | ^0.575.0 | Icone |
| `react-qr-code` | ^2.0.18 | QR code |
| `date-fns` | ^4.4.0 | Formattazione date in alcune viste client |
| `pdf-lib` | ^1.17.1 | Gestione PDF lato admin |
| `@vercel/analytics` | ^2.0.1 | Analytics |
| `@vercel/speed-insights` | ^2.0.0 | Speed Insights |
| `babel-plugin-react-compiler` | 1.0.0 | React Compiler |
| `dotenv` | ^17.3.1 | Supporto env locale |
| `eslint` | ^9 | Lint |
| `eslint-config-next` | 16.1.6 | Preset ESLint Next.js |
| `agentation`, `thinking-orbs` | presenti | Dipendenze non centrali per il flusso pubblico |

Script utili:

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
npm run generate-hash -- "password"
```

---

## 4. Configurazione e deploy

### 4.1 File di configurazione

- `next.config.js`
  - abilita `next-intl` con `src/i18n/request.ts`
  - imposta Content Security Policy e security headers globali
  - consente immagini da Google Drive / Googleusercontent e alcuni embed esterni
  - `script-src` include `'unsafe-eval'` solo quando `NODE_ENV !== "production"`
    (serve solo per Fast Refresh/HMR in sviluppo); `'unsafe-inline'` resta in
    entrambi gli ambienti perché richiesto dagli script inline di streaming
    RSC di Next.js App Router (`self.__next_f.push(...)`), non rimovibile
    senza introdurre una CSP a nonce (cambio architetturale più ampio)

- `vercel.json`
  - build command: `next build`
  - route API con `maxDuration` maggiore
  - cache-control disattivato sulle API

- `eslint.config.mjs`
  - configurazione lint del progetto

- `tsconfig.json`
  - configurazione TypeScript del workspace

- `postcss.config.mjs`
  - integrazione Tailwind/PostCSS

### 4.2 Variabili d'ambiente rilevate nel codice

Le variabili effettivamente usate nel repository sono:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SESSION_SECRET=
MONGODB_URI=
MONGODB_DB=
NEXT_PUBLIC_SITE_URL=
YOUTUBE_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
# Alternative names created by the Vercel Marketplace integration
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Note operative:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` alimentano il layer admin Supabase.
- `ADMIN_SESSION_SECRET` firma la sessione admin JWT.
- `MONGODB_URI` e `MONGODB_DB` alimentano MongoDB per contenuti, utenti e iscrizioni.
- `NEXT_PUBLIC_SITE_URL` viene usato per costruire URL assoluti in alcune API.
- `YOUTUBE_API_KEY` alimenta l'endpoint del canale YouTube.
- `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` oppure `KV_REST_API_URL`/`KV_REST_API_TOKEN` sono **opzionali**:
  alimentano `src/lib/redis/client.ts` (rate limiting e revoca token admin,
  vedi §6.4.3). Se assenti, l'app funziona comunque con un fallback in
  memoria di processo (comportamento pre-esistente).
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`
  alimentano il login/registrazione tramite provider esterni (`src/lib/oauth/*`,
  `src/app/api/auth/oauth/**`). Nessun fallback: se assenti, il rispettivo
  provider è disabilitato lato UI (vedi §7 nuova sezione autenticazione OAuth
  se presente, altrimenti PROJECT_CONTEXT.md non richiede aggiornamenti
  ulteriori per questo task).

---

## 5. Architettura generale

### 5.1 Route groups e layout

- `src/app/(main)`
  - sito pubblico
  - include home, pagine contenuto, profilo, iscrizioni e sezione live / orari

- `src/app/admin/login`
  - pagina autonoma di login admin

- `src/app/admin/(dashboard)`
  - shell protetta del pannello amministrativo
  - sidebar admin, topbar fissa e toast

### 5.2 Layout principali

- `src/app/layout.tsx`
  - root layout globale
  - carica tre font Google: `Source_Sans_3`, `Cormorant_Garamond`, `Noto_Naskh_Arabic`
  - avvolge tutto con `NextIntlClientProvider`
  - avvolge tutto con `AuthProvider`
  - renderizza `LoginModal` e `RegisterModal`
  - include `Analytics` e `SpeedInsights`

- `src/app/(main)/layout.tsx`
  - shell pubblica con `Navbar`, `Sidebar`, `Footer`
  - struttura flex full-height con area contenuto centrale

- `src/app/admin/layout.tsx`
  - layout minimale per la login admin

- `src/app/admin/login/layout.tsx`
  - layout centrato per la pagina di login admin

- `src/app/admin/(dashboard)/layout.tsx`
  - shell admin con sidebar fissa e contenuto spostato a destra
  - server component `async`: verifica `getAdminSession()` e reindirizza a
    `/admin/login` se assente/scaduta/disattivata, prima di renderizzare
    la shell (vedi §6.4.1)

---

## 6. Modello dati e persistenza

### 6.1 Layer pubblico di lettura

- `src/lib/db.ts` è il punto di accesso usato dalle pagine pubbliche.
- Usa `unstable_cache` con revalidate a 60 secondi e tag di invalidazione.
- Espone letture per:
  - icone
  - testi sacri / libreria
  - preghiere
  - video corsi
  - eventi
  - orari settimanali
  - iscrizioni evento

### 6.2 Layer MongoDB contenuti

- `src/lib/mongo/content.ts` è il layer reale dei contenuti.
- Gestisce le collezioni:
  - `icone`
  - `testi_sacri`
  - `preghiere`
  - `video_corsi`
  - `eventi`
  - `orari_settimanali`
  - `file_privati`
- Crea indici su `id`, `slug`, `giorno` e altri campi utili.
- Normalizza gli eventi con `raccoglimento` e ordina gli orari secondo la settimana italiana.
- Le collezioni non vengono più popolate da dati demo all'avvio: partono vuote e vengono riempite dall'admin.

### 6.3 Layer legacy / compatibilità

- `src/lib/data/store.ts`
  - store in-memory di compatibilità con il vecchio flusso Supabase
  - ora parte vuoto e non contiene più dati demo

- `src/lib/supabase/content.ts`
  - layer Supabase residuo che legge e scrive alcune entità
  - in assenza di dati, cade sullo store in-memory compatibile
  - non deve essere interpretato come seed demo attivo

### 6.4 Sessioni e autenticazione

- `src/lib/auth/session.ts` crea e valida il JWT admin con `ADMIN_SESSION_SECRET`.
- `src/lib/mongo/sessions.ts` crea e valida il JWT utente normale.
- I cookie in uso sono:
  - `admin_session` per admin
  - `user_session` per utenti normali
- Non esiste un persistere delle sessioni in DB per il flusso attuale.

#### 6.4.1 Stato sicurezza post-audit (2026-09-12)

Un audit di sicurezza/UX/grafica (branch `fix/security-ux-graphics-audit`) ha
corretto le seguenti vulnerabilità e ora documenta lo stato reale:

- **Route admin protette.** Tutte le route sotto `src/app/api/admin/**`
  richiedono ora `requireAdminSession()` (o `requireSuperAdminSession()` dove
  già previsto) su ogni handler HTTP. In precedenza `eventi`, `icone`,
  `libreria`, `libreria-privata`, `orari`, `preghiere` e `video-corsi`
  accettavano GET/POST/PUT/DELETE senza alcun controllo di sessione. Le route
  `section-visibility/route.ts` e `section-visibility/[sectionId]/route.ts`
  reimplementavano localmente la verifica sessione (`requireAdminUser()`
  duplicato): ora riusano `requireAdminSession()` da `session.ts`.
- **Guard centralizzato nel layout dashboard.** `src/app/admin/(dashboard)/layout.tsx`
  è un server component `async` che chiama `getAdminSession()` e fa
  `redirect("/admin/login")` se la sessione è assente, scaduta o
  l'account è disattivato (tutti e tre i casi già coperti da
  `getAdminSession()`). Prima il layout non eseguiva alcun controllo:
  la shell admin (sidebar/topbar) poteva renderizzarsi anche senza sessione,
  lasciando la protezione reale solo ai singoli fetch client-side.
- **Nessun fallback debole per la secret JWT.** `src/lib/auth/jwt.ts` non
  ripiega più su `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chiave pubblica) o su una
  stringa hardcoded (`"san-marco-dev-jwt-secret"`) quando `ADMIN_SESSION_SECRET`
  manca: `getJwtSecret()` lancia un errore esplicito. `ADMIN_SESSION_SECRET`
  è confermata impostata su Vercel Production, quindi il deploy del fix non
  ha richiesto azioni aggiuntive. Non è stata eseguita alcuna rotazione
  manuale della secret: poiché il JWT è verificato solo per firma HMAC,
  la rimozione del fallback invalida automaticamente, dal primo deploy del
  fix in poi, qualunque token eventualmente firmato in passato con la chiave
  pubblica (la verifica contro la secret reale fallisce). Non è stato
  possibile escludere con certezza che il fallback fosse scattato in
  passato in produzione; se sorgono dubbi su sessioni admin anomale dopo
  questa data, il fix stesso è la mitigazione.
- **Redirect al login su sessione scaduta durante l'uso.** Le pagine
  client della dashboard non usano più `fetch` diretto verso
  `/api/admin/*`, ma `adminFetch()` da
  `src/lib/admin/fetch-with-auth-redirect.ts`, che reindirizza a
  `/admin/login` su risposta 401 invece di mostrare tabelle vuote o errori
  silenziosi.
- **Limiti noti rimasti aperti (non risolti in questo audit, fuori scopo):**
  - ~~Rate limiting login/IP e revoca token admin vivono in memoria di
    processo~~ — **risolto in §6.4.3** (2026-09-12): entrambi ora usano
    Redis (Upstash) quando configurato, con fallback automatico
    all'in-memoria se le env var non sono presenti.
  - `src/app/api/auth/login/route.ts`: il lookup admin su Supabase usava
    `.or()` con l'identifier utente interpolato direttamente nella
    mini-sintassi PostgREST (rischio di alterazione del filtro). Corretto
    con due query `.eq().maybeSingle()` separate (username, poi email);
    comportamento di login invariato, solo il meccanismo di lookup è più
    sicuro.
  - `dir="ltr"` in `src/app/layout.tsx` è hardcoded indipendentemente dalla
    lingua: il supporto RTL per `ar` si basa solo su `text-align: right`
    via selettore CSS `[data-locale="ar"]`, non sull'attributo `dir`
    nativo. Preesistente, non toccato in questo audit (avrebbe richiesto
    verifica visiva approfondita non disponibile in questa sessione senza
    browser).
  - Il controllo `requireAdminSession()` è ripetuto identico in ogni
    handler HTTP delle 7 route appena protette (`eventi`, `icone`,
    `libreria`, `libreria-privata`, `orari`, `preghiere`, `video-corsi`) —
    corretto e sicuro, ma duplicato: una futura route admin aggiunta senza
    copiare questo boilerplate riaprirebbe lo stesso buco. Non consolidato
    in questo audit in un `middleware.ts` o wrapper condiviso perché è un
    cambio più ampio (Edge runtime, matcher su tutte le route
    `/api/admin/*`) che richiede test più estesi di quelli eseguibili in
    questa sessione; considerarlo come refactor futuro dedicato.

#### 6.4.3 Rate limiting e revoca token su Redis (2026-09-12)

Segue un audit generale del progetto che aveva ri-segnalato il limite già
noto (rate limit e revoca token "per istanza" su Vercel serverless).
Risolto introducendo Redis come backend condiviso, con fallback
automatico al comportamento precedente quando Redis non è configurato.

- Provider scelto: **Upstash Redis** (`@upstash/redis`, client HTTP senza
  connessione TCP persistente) — l'unica scelta sensata in un ambiente
  serverless come le funzioni Vercel, dove un client Redis a connessione
  persistente (`ioredis`/`node-redis`) richiederebbe gestione di
  connection pooling non banale.
- `src/lib/redis/client.ts`: client singleton `getRedis()` che legge
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`; ritorna `null` se
  non configurate.
- `src/lib/auth/rate-limit.ts`: le 6 funzioni esportate sono diventate
  `async`. Quando Redis è configurato usano `INCR` + `EXPIRE` (finestra
  scorrevole: l'`EXPIRE` viene impostato solo al primo incremento della
  finestra, non ad ogni richiesta) su chiavi `ratelimit:login:{ip}` e
  `ratelimit:request:{ip}`. Quando Redis non è configurato, ricadono
  sulla stessa `Map` in memoria di processo usata prima di questa
  modifica — nessuna rottura per l'ambiente di sviluppo locale (dove non
  è configurato in questa sessione).
- `src/lib/auth/session.ts`: la revoca token (`deleteSession` →
  `revokeToken`, controllata in `validateSession` → `isTokenRevoked`) usa
  una chiave Redis `admin_revoked:{token}` con **TTL pari alla scadenza
  residua del JWT** (decodificata dal campo `exp` senza verificarne la
  firma — solo per calcolare la TTL, non per fidarsi del contenuto: la
  validazione della firma resta in `verifyJwt()`), così la chiave di
  revoca scompare da sola quando il token sarebbe comunque scaduto,
  invece di accumularsi indefinitamente. Fallback in memoria (`Set`)
  identico a prima se Redis non è configurato.
- 6 call site aggiornati con `await` (già dentro handler `async`,
  modifica meccanica): `api/auth/login`, `api/admin/login`,
  `api/auth/register`, `api/eventi/iscrizione`, `api/youtube/channel`.
- Verificato: `tsc --noEmit` pulito, `eslint` senza nuovi errori/warning
  sui file toccati, endpoint `/api/auth/login` testato via `curl` in
  locale (senza `UPSTASH_*` configurate → percorso fallback in-memoria)
  con risposta 401 e contatore `remaining` corretto.
- **Non verificato in questa sessione**: comportamento con Redis
  realmente configurato (nessuna istanza Upstash disponibile in locale) —
  da confermare in un ambiente con `UPSTASH_REDIS_REST_URL`/`_TOKEN`
  impostate (es. dopo aver collegato un'istanza Upstash da Vercel
  Marketplace) prima del prossimo deploy in produzione.

#### 6.4.2 Convenzioni UI admin

Il pannello admin usava classi Tailwind hardcoded (`bg-gray-50`,
`text-gray-900`, `border-gray-200`, mix incoerente `gold`/`amber-600`/`amber-700`
tra pagine) invece dei token semantici già definiti in `src/app/globals.css`
e usati dal sito pubblico. Un audit ha consolidato l'admin su questi token:

| Prima (hardcoded) | Ora (token semantico) |
|---|---|
| `bg-gray-50` | `bg-background` |
| `bg-white` | `bg-surface` |
| `bg-gray-100` / `bg-gray-200` | `bg-surface-2` |
| `bg-gray-300` | `bg-border` |
| `border-gray-100/200/300` | `border-border` |
| `border-gray-900` | `border-foreground` |
| `text-gray-900` / `text-gray-800` | `text-foreground` |
| `text-gray-700` / `600` / `500` / `400` | `text-foreground/80` / `/70` / `/60` / `/40` |
| `amber-600` | `gold-light` (stesso hex, `#D97706`) |
| `amber-700` | `gold` (stesso hex, `#B45309`) |

**Convenzione da seguire per nuove pagine admin:** usare sempre i token
semantici sopra (già disponibili via `@theme` in `globals.css`) invece di
classi Tailwind con colori hardcoded, per coerenza col brand pubblico e per
non dover reintervenire in futuro se si introduce una dark mode.

Eccezioni intenzionali non toccate dal consolidamento:
- `src/app/admin/login/page.tsx` e `src/components/admin/AdminSidebar.tsx`
  usano uno sfondo scuro dedicato (`text-gray-300/400` come testo chiaro su
  sfondo scuro): non hanno un token semantico "chiaro su scuro" equivalente,
  quindi sono stati lasciati come sono.
- Le tinte `amber-50/100/200/300/500/800/900` usate nei badge/banner di
  avviso (non il colore principale del brand) non hanno un token semantico
  equivalente e rappresentano un uso distinto (colore di stato "warning"),
  non la stessa incoerenza gold/amber risolta sopra.

### 6.5 Account admin e utenti normali

- Gli admin sono letti da Supabase nella tabella `admin_users`.
- Gli utenti normali sono letti da MongoDB nella collezione `users`.
- Il login pubblico unificato in `/api/auth/login` tenta prima l'admin Supabase e poi l'utente MongoDB.
- La route `/api/admin/login` rimane disponibile per il login diretto dell'area amministrativa.

---

## 7. Flusso autenticazione

### 7.1 Root auth client-side

- `src/components/auth/AuthContext.tsx`
  - stato `guest` / `user` / `admin`
  - espone `showLoginModal`, `showRegisterModal`, `isExplicitGuest`, `refresh`, `logout`
  - esegue `GET /api/auth/me` al mount
  - salva `admin_info` in `localStorage` quando serve

- `src/components/auth/LoginModal.tsx`
  - modale login condivisa

- `src/components/auth/RegisterModal.tsx`
  - modale registrazione condivisa

### 7.2 Endpoint principali

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/update-profile`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/youtube/channel`

### 7.3 Logica login unificato

- `src/app/api/auth/login/route.ts` verifica il rate limit per IP.
- Prova prima il match admin su Supabase usando username o email.
- Se l'admin è valido, aggiorna `ultimo_accesso` e setta `admin_session`.
- Se fallisce, prova l'utente normale su MongoDB usando email o username.
- Se fallisce anche quello, incrementa i tentativi falliti e restituisce errore 401.

### 7.4 Login/registrazione tramite Google e Facebook (2026-09-14)

Aggiunto il supporto per accedere/registrarsi tramite Google e Facebook,
oltre a collegare/scollegare questi provider a un account email+password
già esistente. Nessun secondo sistema di autenticazione: tutto riusa
`src/lib/auth/jwt.ts` (HMAC, `ADMIN_SESSION_SECRET`), il cookie
`user_session` e la collezione MongoDB `users` già esistenti. Apple Sign In
è predisposto nell'architettura ma non implementato in questa fase (richiede
un Apple Developer Program a pagamento — vedi §7.4.7).

Spec di riferimento:
`docs/superpowers/specs/2026-09-14-oauth-providers-design.md`.
Piano di implementazione:
`docs/superpowers/plans/2026-09-14-oauth-providers.md`.

#### 7.4.1 File creati/modificati

Layer OAuth condiviso:
- `src/lib/oauth/providers.ts` — adapter Google/Facebook costruiti su
  `arctic` (nuova dipendenza); `getProviderAdapter()` ritorna `null` se le
  env var del provider mancano (provider disabilitato lato UI, non un crash).
- `src/lib/oauth/flow-cookie.ts` — cookie firmati `oauth_flow` (state/PKCE,
  10 minuti, mono-uso) e `oauth_pending` (identità provvisoria, 30 minuti),
  costruiti sopra `signJwt`/`verifyJwt` esistenti.
- `src/lib/oauth/error-messages.ts` — mappa i codici di errore del callback
  a chiavi di traduzione già esistenti in `it.json`/`ar.json`.

Modello dati (`src/lib/mongo/`):
- `oauth-identities.ts` — nuova collezione `oauth_identities` (identità
  esterne collegate; indice unico su `(provider, providerAccountId)`).
- `pending-oauth-registrations.ts` — nuova collezione
  `pending_oauth_registrations` (registrazioni provvisorie; indice TTL 24h
  su `expiresAt`).
- `users.ts` / `src/types/index.ts` — nuovo campo opzionale
  `hasPassword?: boolean` su `UserProfile` (assente = `true`, retrocompatibile);
  `createOAuthUser()` crea account solo-provider con `hasPassword:false` e
  un `passwordHash` derivato da un token casuale (nessuna password reale
  può produrlo); `setHasPassword()`.

Route API (`src/app/api/auth/oauth/`):
- `GET /[provider]/start` — avvia il flusso OAuth (login/register/link).
- `GET /[provider]/callback` — verifica `state`, scambia il code, decide
  login diretto / registrazione provvisoria / collegamento.
- `GET /pending` — dati non sensibili per pre-compilare il quiz dopo il
  redirect dal provider.
- `POST /complete-registration` — finalizza la registrazione dopo il quiz;
  mai si fida di `provider`/`providerAccountId` dal body, solo dal cookie
  firmato risolto via DB.
- `POST /unlink` — scollega un provider, bloccato se è l'ultimo metodo di
  accesso disponibile.
- `GET /status` — stato dei collegamenti per la pagina profilo.

UI:
- `src/components/auth/ProviderIcons.tsx` — icone Google/Facebook condivise.
- `src/components/auth/LoginModal.tsx` — bottoni "Continua con
  Google/Facebook" sopra il form classico; gestisce anche `?oauthError=`.
- `src/components/auth/RegisterModal.tsx` — stessi bottoni sullo step
  credenziali; nuova "modalità OAuth" che, rilevato
  `?completeRegistration=1`, salta direttamente allo step quiz esistente
  (mai bypassabile: il guard `if (!role || !ageGroup)` resta il primo
  controllo in `handleSubmit` per entrambe le modalità) e sottomette a
  `complete-registration` invece che a `/api/auth/register`.
- `src/components/profile/LinkedAccountsSection.tsx` +
  `src/app/(main)/profilo/page.tsx` — sezione "Accessi collegati" nel
  profilo (collega/scollega, conferma, stato non-scollegabile se unico
  metodo, banner `?linked=`/`?oauthError=`).

Script opzionale: `src/scripts/backfill-has-password.ts` (idempotente,
imposta `hasPassword:true` esplicito sui documenti `users` che ne sono
privi — non necessario per il funzionamento).

#### 7.4.2 Flusso di nuova registrazione tramite provider

1. L'utente clicca "Continua con Google/Facebook" in `RegisterModal`
   (`intent=register`) → redirect al provider con `state` + PKCE (Google)
   firmati in un cookie `oauth_flow` mono-uso (10 min).
2. Il callback verifica `state`, scambia il code, legge il profilo
   verificato **solo lato server** (Google: ID token OIDC; Facebook: Graph
   API `/me` con l'access token, mai esposto al client).
3. Se `(provider, providerAccountId)` non esiste ancora in
   `oauth_identities`: crea un documento `pending_oauth_registrations`,
   setta il cookie `oauth_pending` (30 min), redirect a
   `/?completeRegistration=1`. **Nessun account viene creato a questo
   punto.**
4. Il frontend rileva il parametro, chiama `GET /api/auth/oauth/pending`,
   apre `RegisterModal` direttamente sullo step quiz (nome/cognome
   pre-compilati; email richiesta manualmente solo se il provider non
   l'ha fornita).
5. Al submit del quiz, `POST /api/auth/oauth/complete-registration`
   ri-verifica il cookie `oauth_pending` lato server (mai il body della
   richiesta), valida ruolo/età, rifiuta con 409 se l'email risulta già
   registrata (**nessun merge automatico**), crea l'utente
   (`hasPassword:false`), crea `oauth_identities`, cancella il pending,
   crea `user_session` e reindirizza come una registrazione classica
   riuscita.
6. Se l'utente abbandona dopo l'autenticazione ma prima del quiz: nessun
   account creato, il pending sopravvive fino a 24h (TTL Mongo) e riprende
   dal cookie `oauth_pending` al rientro — nessun duplicato, nessun dato
   perso.

#### 7.4.3 Flusso di accesso tramite provider

Stesso `start`/`callback`, ma `findOAuthIdentity(provider, providerAccountId)`
trova già un collegamento: si verifica che l'utente sia attivo, si aggiorna
`ultimoAccesso`, si crea `user_session` con lo stesso meccanismo del login
classico. Nessun quiz mostrato, nessuna modifica a profilo/ruolo/permessi.

#### 7.4.4 Flusso di collegamento a un account esistente

Dal profilo, bottone "Collega" (`intent=link`, richiede `user_session`
valido). Il cookie `oauth_flow` include l'hash della sessione corrente; il
callback ri-verifica che la sessione al ritorno sia la stessa (protezione
CSRF/hijack), risolve l'utente dalla sessione (mai dal cookie di flusso),
e crea `oauth_identities` collegata a quell'utente. Se l'identità è già
collegata a **un altro** account: 409, nessuna riassegnazione. Nessuna
creazione di utente, nessuna modifica a dati/ruolo/quiz esistenti, nessun
nuovo quiz richiesto.

#### 7.4.5 Variabili d'ambiente

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Riusa `NEXT_PUBLIC_SITE_URL` già esistente per costruire le callback URL.
Vedi `.env.example` per il blocco completo con commenti.

#### 7.4.6 Configurazioni esterne necessarie (passaggi manuali dell'utente)

- **Google Cloud Console**: OAuth consent screen + OAuth client ID (Web
  application), redirect URI autorizzato:
  `${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/google/callback`.
- **Facebook Developers**: app con prodotto "Facebook Login", Valid OAuth
  Redirect URI: `${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/facebook/callback`,
  permessi `email` + `public_profile` (default, nessuna App Review
  necessaria in development mode con utenti di test).
- **Vercel**: impostare le quattro env var sopra in Production/Preview.

#### 7.4.7 Migrazioni database

Nessuna migrazione obbligatoria (MongoDB è schema-less; `hasPassword`
assente è trattato come `true` a runtime). Script di backfill opzionale
e idempotente: `npm run backfill-has-password`.

#### 7.4.8 Verifiche eseguite in questa sessione

- `npm test`: 54/54 test passati (13 nuovi file di test aggiunti dalla
  feature, copertura di tutte le route API e del layer dati).
- `npm run lint`: 16 errori/35 warning preesistenti, **tutti** in file mai
  toccati da questa feature (verificato file per file contro il branch
  `main` pre-feature); nessun nuovo errore o warning introdotto.
- `npx tsc --noEmit`: 0 errori.
- `npm run build`: completata con successo, tutte le 6 nuove route
  `/api/auth/oauth/*` presenti nell'output.
- Ogni singolo task del piano è stato revisionato da un agente dedicato
  (spec compliance + qualità), con particolare attenzione di sicurezza
  sulle route `callback` (walkthrough dello scenario di dirottamento
  sessione durante il collegamento) e `complete-registration` (verifica
  che il body della richiesta non possa mai determinare l'identità
  collegata).

**Non verificato in questa sessione** (richiede credenziali OAuth reali
che non erano disponibili): l'intero flusso end-to-end in browser con
Google/Facebook reali — primo accesso, ripristino di una registrazione
abbandonata, collegamento/scollegamento con provider reali, gestione di un
utente Facebook senza email, annullamento del consenso, verifica visiva
desktop/tablet/mobile e in arabo. Prima del prossimo deploy in produzione,
seguire la checklist completa in
`docs/superpowers/plans/2026-09-14-oauth-providers.md` (Task 16) con
credenziali reali configurate in un ambiente di test.

**Nessun segreto è stato aggiunto al repository**: `.env.example` contiene
solo nomi di variabili con valori vuoti; verificato leggendo per intero
ogni file nuovo di questa feature prima di questo commit.

---

## 8. Visibilità sezioni

### 8.1 Gate

- `src/lib/mongo/visibility.ts` gestisce i permessi per sezione.
- `src/components/SectionVisibilityGate.tsx` decide lato server se mostrare contenuto, pagina coming soon o blocco accesso negato.

### 8.2 Sezioni attualmente wrappate

- `/eventi`
- `/icone`
- `/libreria`
- `/orari`
- `/preghiere`
- `/video-corsi`

### 8.3 API di supporto

- `GET /api/public/section-visibility` fornisce al client la visibilità delle sezioni.

---

## 9. Struttura del progetto

### 9.1 Root e file di supporto

- `README.md` documentazione sintetica del progetto
- `PROJECT_CONTEXT.md` contesto operativo dettagliato
- `vercel.json` configurazione deploy Vercel
- `next.config.js` config Next/CSP
- `package.json` dipendenze e script
- `tsconfig.json` configurazione TypeScript
- `eslint.config.mjs` configurazione lint
- `tailwind.config.mjs` config Tailwind di supporto

### 9.2 App pubblica

- `src/app/(main)/page.tsx` home page con hero, orari, live, contenuti in evidenza
- `src/app/(main)/chi-siamo/page.tsx`
- `src/app/(main)/contatti/page.tsx`
- `src/app/(main)/eventi/page.tsx`
- `src/app/(main)/icone/page.tsx`
- `src/app/(main)/libreria/page.tsx`
- `src/app/(main)/orari/page.tsx`
- `src/app/(main)/preghiere/page.tsx`
- `src/app/(main)/video-corsi/page.tsx`
- `src/app/(main)/iscrizioni/page.tsx`
- `src/app/(main)/profilo/page.tsx`

### 9.3 App admin

- `src/app/admin/(dashboard)/page.tsx` dashboard amministrativa
- cartelle admin per gestione contenuti, utenti, permessi, visibilità e iscrizioni

### 9.4 Componenti principali

- `src/components/Navbar.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Footer.tsx`
- `src/components/EventiList.tsx`
- `src/components/IconeGrid.tsx`
- `src/components/OrariTable.tsx`
- `src/components/NextCelebrationCard.tsx`
- `src/components/YouTubeLiveSection.tsx`
- `src/components/SectionVisibilityGate.tsx`
- `src/components/ComingSoonPage.tsx`
- `src/components/auth/*`
- `src/components/admin/*`

### 9.5 Layer dati e utility

- `src/lib/db.ts`
- `src/lib/mongo/content.ts`
- `src/lib/mongo/registrations.ts`
- `src/lib/mongo/sessions.ts`
- `src/lib/mongo/users.ts`
- `src/lib/mongo/client.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/rate-limit.ts`
- `src/lib/admin/fetch-with-auth-redirect.ts` — wrapper `adminFetch()` usato
  dalle pagine client della dashboard: reindirizza a `/admin/login` su
  risposta 401 invece di lasciare la UI in uno stato silenzioso
- `src/lib/section-access.ts`
- `src/lib/gdrive.ts`
- `src/lib/next-celebration.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`

### 9.6 Tipi e traduzioni

- `src/types/index.ts` definisce i modelli principali: `Icona`, `TestoSacro`, `Preghiera`, `VideoCorso`, `Evento`, `OrarioSettimanale`, `IscrizioneEvento`, `UserSessionInfo`, `AdminSessionInfo`.
- `src/messages/it.json` e `src/messages/ar.json` contengono le traduzioni.
- `src/i18n/request.ts` configura `next-intl` lato server.

---

## 10. Home page e contenuti

### 10.1 Hero page

- La hero è in `src/app/(main)/page.tsx`.
- Mostra titolo, sottotitolo, call to action sugli orari e accesso alla pagina eventi.
- La card che invitava all'iscrizione all'evento attivo è stata disattivata nel codice ma lasciata commentata, pronta per essere riattivata senza riscrittura.
- La card della prossima celebrazione usa `NextCelebrationCard` e i dati degli orari settimanali.

### 10.2 Contenuti in evidenza

- La home mostra anche un blocco eventi e un blocco preghiere.
- Gli eventi hanno uno stato vuoto esplicito.
- Le preghiere e la libreria mostrano uno stato vuoto quando le collezioni sono assenti.

### 10.3 Sezioni con dati reali o vuoti

- `eventi` dipende dai contenuti reali in MongoDB e dal conteggio iscrizioni.
- `icone`, `libreria`, `preghiere`, `video-corsi` e `orari` non ricevono più seed demo automatici.
- Tutte le sezioni con liste di contenuti (`eventi`, `icone`, `libreria`,
  `preghiere`, `video-corsi`) mostrano ora uno stato vuoto curato e coerente
  quando la collezione è vuota (pattern comune: contenitore con bordo
  tratteggiato e messaggio dedicato). `IconeGrid` distingue esplicitamente
  "nessuna icona esistente" da "nessuna icona che rispetta i filtri
  selezionati".

---

## 10.4 Refresh grafico home/hero/navbar/footer (2026-09-12)

Un audit critico di design (art direction) ha rilevato che l'hero, le card
"contenuti in evidenza" e alcuni elementi del footer avevano un aspetto
molto simile a un template generato automaticamente: blob sfocati (`blur-3xl`)
puramente decorativi nell'hero, due card "featured" identiche per peso
visivo, etichette eyebrow generiche (solo maiuscolo+tracking), badge icona
in cerchio arrotondato ripetuto ovunque. Palette cromatica (oro/crema)
mantenuta invariata su richiesta esplicita: il lavoro si è concentrato su
composizione, tipografia e motivi distintivi, non sui colori.

Modifiche applicate:

- `src/app/globals.css`
  - nuova classe `.eyebrow` (etichetta con trattino disegnato via `::before`
    invece del solo uppercase+tracking, per un'identità più riconoscibile)
  - nuova classe `.texture-lattice` (motivo a reticolo incrociato, usato come
    texture di sfondo molto tenue nell'hero al posto dei blob sfocati)
  - classe `.coptic-mark` predisposta per marchi a croce (non ancora usata
    oltre al footer)
- `src/app/(main)/page.tsx`
  - hero: rimossi i due blob `blur-3xl` decorativi senza funzione; aggiunta
    texture a reticolo molto tenue (`text-primary/[0.035]`) e un divisore
    verticale dorato che segna la composizione a due colonne su desktop
  - titolo hero portato a `text-3xl`/`sm:text-5xl` con `leading-[1.1]` per
    più presenza tipografica; eyebrow convertito alla classe `.eyebrow`
  - meta riga data/luogo: da due "pillole" arrotondate generiche a un
    blocco con bordo sinistro dorato (meno "badge in libreria componenti",
    più intenzionale)
  - sezione "Vivi la chiesa dal vivo": titolo passato a `font-display`
  - sezione "Contenuti in primo piano": le due card (eventi/preghiere) non
    sono più identiche — la card eventi ha un header con sfondo accent e
    bordo dorato (priorità visiva maggiore), la card preghiere resta più
    leggera; griglia asimmetrica `1.2fr/1fr` invece di `1fr/1fr`
- `src/components/Navbar.tsx`
  - bordo inferiore della topbar da `border-border/80` neutro a
    `border-accent/20`, per un accento di brand invece di un bordo grigio
    generico
- `src/components/Footer.tsx`
  - sfondo footer semplificato: da gradiente a tre stop
    (`from-surface-2 via-surface-alt to-background`) a un singolo
    `bg-surface-2/70` con bordo superiore accent — meno "effetto sfondo
    decorativo AI", più piatto e intenzionale
  - marchio a croce (☦): da badge circolare `bg-accent/20 rounded-2xl`
    (pattern icona-in-cerchio ripetuto ovunque nel sito) a un riquadro
    squadrato con solo bordo dorato; il glifo usa il variation selector
    testuale `︎` perché senza di esso Windows/Chrome lo renderizza
    come icona emoji a colori invece che come carattere tipografico
    (bug scoperto durante la verifica visiva in browser, non solo lettura
    codice)
  - nome chiesa passato a `font-display text-lg` (era `text-base` senza
    font display) per coerenza con gli altri titoli del sito

Verifiche eseguite:

- `npx tsc --noEmit` pulito, nessun errore
- `npx eslint` sui file toccati: 0 errori (2 warning preesistenti non
  legati a questa modifica, su variabili non usate nella home)
- verifica visiva in browser (Chrome via MCP) su `/` in italiano e arabo:
  hero, sezione orari/live, contenuti in evidenza, footer desktop e footer
  mobile-accordion
- durante la verifica è emerso che una vecchia istanza `next dev` sulla
  porta 3000 (avviata alle 01:07, prima di queste modifiche) serviva CSS
  stale e non rifletteva le nuove classi: riavviata per la verifica

Non ancora affrontato in questo audit (lavoro futuro, fuori scopo di
questa sessione):

- pagine interne (`chi-siamo`, `eventi`, `icone`, `libreria`, `orari`,
  `preghiere`, `video-corsi`, `contatti`, `profilo`, `iscrizioni`) —
  usano ancora il pattern precedente di card arrotondate uniformi
- componenti condivisi non toccati: `EventiList`, `IconeGrid`,
  `OrariTable`, `NextCelebrationCard`, `YouTubeLiveSection`,
  `SectionVisibilityGate`, `ComingSoonPage`
- area admin (già consolidata su token semantici in un audit precedente,
  §6.4.2, ma non ridisegnata dal punto di vista della composizione)
- verifica responsive mobile via browser automation non completata al
  100%: il resize della finestra Chrome non ha modificato il viewport di
  cattura schermo nella sessione MCP; le classi responsive esistenti
  (`sm:`/`lg:`) non sono state rimosse né alterate nelle sezioni toccate,
  quindi il comportamento mobile pre-esistente dovrebbe essere preservato,
  ma non è stato riconfermato visivamente a 390px di larghezza in questa
  sessione

## 10.5 Refresh grafico pagine interne (Fase 2, 2026-09-12)

Estesa la stessa lingua visiva (§10.4: `.eyebrow`, `.texture-lattice`,
`font-display` sui titoli, meno badge icona-in-cerchio ripetuti ovunque) a
tutte le pagine pubbliche rimanenti e ai componenti condivisi non ancora
toccati. Nessuna modifica a logica dati, fetch, props, tipi o chiavi i18n.

File modificati:

- `src/app/(main)/chi-siamo/page.tsx` — header con `.eyebrow` + texture
  lattice tenue; le due card "pilastro" (missione/comunità) non sono più
  identiche: la prima ha bordo accent, icona quadrata con solo bordo e
  sfondo `surface-alt`, la seconda resta su icona circolare neutra;
  blocco "Fonti" finale passato da card generica a blocco con bordo
  sinistro accent (pattern già usato nell'hero della home)
- `src/app/(main)/contatti/page.tsx` — header con `.eyebrow`; card
  Email/Indirizzo differenziate (Email: bordo accent, icona quadrata;
  Indirizzo: icona circolare primary) invece di essere identiche;
  etichette sezione "Sacerdoti" e "Social" convertite a `.eyebrow`
- `src/app/(main)/eventi/page.tsx` + `src/components/EventiList.tsx` —
  header con eyebrow; il primo evento in lista (il più vicino) ha ora
  bordo doppio accent ed eyebrow proprio nella card, per dargli priorità
  visiva rispetto agli altri; stato vuoto e colori della card portati da
  `gray-*`/`bg-white` hardcoded a token semantici (`bg-surface`,
  `border-border`, `text-foreground/*`). Il modale di iscrizione (form
  multi-step complesso, ~500 righe) non è stato toccato: troppo rischioso
  ridisegnare la logica visiva di un form con validazione, step
  condizionali e integrazione API in un audit grafico — resta con i suoi
  `gray-*` hardcoded, da considerare in un refactor dedicato futuro
- `src/app/(main)/icone/page.tsx` + `src/components/IconeGrid.tsx` —
  header con eyebrow; filtri e card portati a token semantici; stato
  vuoto uniformato al pattern "bordo tratteggiato" già usato in home e
  libreria. La griglia di card resta uniforme intenzionalmente: è una
  galleria fotografica (icone sacre), dove l'uniformità delle card è
  corretta dal punto di vista curatoriale — variarla artificialmente
  avrebbe reintrodotto rumore visivo senza motivo
- `src/app/(main)/libreria/page.tsx` — stesso trattamento (eyebrow,
  token semantici); griglia libri lasciata uniforme per lo stesso motivo
  delle icone (galleria di copertine)
- `src/app/(main)/orari/page.tsx` — solo redirect a `/#orari`, nessuna
  modifica necessaria
- `src/components/OrariTable.tsx` — non modificato: già usa token
  semantici e ha già una differenziazione intenzionale (riga "prossima
  celebrazione" evidenziata), coerente con l'obiettivo dell'audit
- `src/app/(main)/preghiere/page.tsx` — header con eyebrow; rimossa
  l'icona duplicata nell'header di sezione (era ripetuta identica anche
  su ogni singola card sotto); le card alternano icona quadrata
  bordata/icona circolare in base all'indice per rompere la monotonia
  della lista; colori portati a token semantici
- `src/app/(main)/video-corsi/page.tsx` — stesso pattern di preghiere;
  il primo video ha bordo accent per segnalare priorità (più recente);
  rimosso import `Youtube` non più usato dopo la modifica dell'header
- `src/app/(main)/iscrizioni/page.tsx` — solo eyebrow sui due header
  (stato guest e stato autenticato) e fix di un `bg-white` hardcoded
  residuo; il resto della pagina (card iscrizione con header primary
  scuro, badge tipo iscrizione) era già ben differenziato e non
  richiedeva intervento
- `src/app/(main)/profilo/page.tsx` — tocco leggero come da indicazione:
  eyebrow/font-display sui due titoli principali (stato guest, nome
  utente nella hero card); rimossi i due cerchi decorativi sfocati
  (`opacity-10 bg-white`) dalla hero card, sostituiti con la stessa
  texture a reticolo usata altrove; avatar iniziali portato da cerchio
  pieno a riquadro con solo bordo. Il resto della pagina (tabelle,
  form profilo, gestione permessi superadmin, ~1200 righe totali) non è
  stato toccato: già su token semantici `bg-surface`/`border-border` in
  gran parte, e un redesign più profondo avrebbe richiesto rivedere
  interazioni complesse (editing inline, richieste superadmin) fuori
  scopo per un audit grafico
- `src/components/NextCelebrationCard.tsx` — icona da cerchio pieno a
  riquadro bordato, titolo convertito a `.eyebrow`
- `src/components/ComingSoonPage.tsx` — icona da cerchio pieno a
  riquadro bordato, titolo a `font-display`
- `src/components/SectionVisibilityGate.tsx` — icona lucchetto "accesso
  negato" da emoji nuda a riquadro bordato coerente col resto del sito,
  titolo a `font-display`
- `src/components/YouTubeLiveSection.tsx` — non modificato: è già un
  blocco visivamente distinto (dark, brand YouTube) e non soffre del
  problema "genérico AI", nessun intervento necessario

Problemi tecnici incontrati:

- Nessun bug bloccante. L'unico punto di attenzione era il rischio di
  rompere il form di iscrizione eventi (validazione client-side con
  molti stati React) toccando `EventiList.tsx`: la modifica è stata
  limitata alla card e allo stato vuoto, senza toccare il modale.

Verifiche eseguite:

- `npx tsc --noEmit -p .` pulito, nessun errore
- `npx eslint` su tutti i file toccati: 0 errori, solo warning
  preesistenti (`no-img-element` su `<img>` già presenti prima di questa
  modifica, variabili non usate già presenti in `profilo/page.tsx`)
- verifica visiva in browser (Chrome via MCP) su `/eventi` (gate ospite),
  `/icone` (coming-soon con nuova icona riquadrata), `/chi-siamo`
  (card asimmetriche pilastro missione/comunità) in italiano
- non verificate visivamente in questa sessione: `/contatti`,
  `/libreria`, `/preghiere`, `/video-corsi`, `/iscrizioni`, `/profilo`
  in stato autenticato (il gate di sezione richiede login/admin per
  vedere il contenuto reale di eventi/icone/libreria/preghiere/
  video-corsi) — le modifiche sono state verificate a livello di
  type-check/lint e lettura del JSX risultante, ma non a schermo
- non verificata visivamente la lingua araba sulle pagine di Fase 2
  (verificata solo su home/footer in Fase 1)

Lavoro futuro rimasto fuori scopo:

- Modale di iscrizione eventi (`EventiList.tsx`, form multi-step) e
  form/tabelle interne di `profilo/page.tsx`: usano ancora `gray-*`
  hardcoded, da consolidare su token semantici come già fatto per
  l'admin (§6.4.2) in un refactor dedicato
- Area admin (`src/app/admin/**`): non toccata in nessuna delle due
  fasi di questo audit grafico; già consolidata sui token semantici in
  un audit precedente ma non ridisegnata a livello di composizione
- Verifica visiva completa in stato autenticato e in arabo per tutte le
  pagine di Fase 2

---

## 10.6 Fix: scroll link "Orari settimanali" e preview YouTube (2026-09-12)

Due bug funzionali segnalati dall'utente, non di sola grafica.

### 10.6.1 Link "Orari settimanali" (sidebar/footer/hero) non scrollava

Tutti i link verso `/#orari` (sidebar desktop `SidebarDock.tsx`, dock
mobile `MobileDock.tsx`, footer `Footer.tsx` — 6 occorrenze, CTA hero in
`page.tsx`) usavano `next/link` puro. Comportamento rotto osservato in
browser reale (non solo letto nel codice):

- cliccando "Orari" da un'altra pagina (es. `/eventi`), Next naviga a
  `/#orari` ma non garantisce lo scroll fino alla sezione se il contenuto
  monta dopo la navigazione
- cliccando di nuovo lo stesso link mentre si è **già** su `/#orari`
  (stesso pathname, stesso hash), Next non fa nulla: nessuna navigazione,
  nessuno scroll, perché per il router l'URL di destinazione è identico a
  quello corrente — verificato con `window.scrollY` rimasto a `0` dopo il
  click

Fix:

- nuovo componente `src/components/HashLink.tsx` (client): wrapper di
  `next/link` che intercetta il click quando l'`href` contiene un `#` e la
  pagina corrente coincide col target — in quel caso fa
  `element.scrollIntoView({ behavior: "smooth" })` e aggiorna l'hash con
  `history.replaceState` invece di affidarsi al router; altrimenti lascia
  che `Link` navighi normalmente (il caso cross-page funziona già con
  Next standard una volta risolto il problema di posizionamento sotto la
  navbar, vedi punto successivo)
- sostituito `Link` con `HashLink` in: `SidebarDock.tsx` (rendering
  generico di ogni voce con `href`, non solo "orari" — copre eventuali
  futuri link-a-sezione), `MobileDock.tsx` (stesso pattern), `Footer.tsx`
  (tutte le 6 occorrenze di `/#orari`), `page.tsx` (CTA hero "Scopri gli
  orari")
- aggiunta `scroll-margin-top` su `#orari` e `#live` in `globals.css`
  (`calc(var(--topbar-height) + 16px)`) perché la navbar è `fixed`: senza
  questo, anche uno scroll "corretto" lasciava il titolo della sezione
  nascosto sotto la topbar
- rimosso l'import `Link` ormai inutilizzato da `SidebarDock.tsx`

Verificato in browser: click da `/eventi` → naviga a `/#orari` e scrolla
correttamente sotto la navbar; tornati in cima alla home e ri-cliccato
"Orari" nella sidebar → scrolla di nuovo (`window.scrollY` passa da `0` a
`634` dopo l'animazione), risolvendo il caso "stesso hash, nessun no-op"
che prima non funzionava.

### 10.6.2 Preview "ultimo video" YouTube a volte rotta

`src/app/api/youtube/channel/route.ts`: la query `search.list` per
"l'ultimo video" (`order=date&maxResults=1&type=video`, senza altri
filtri) può restituire come "più recente" una diretta programmata/in
corso (perché i broadcast live compaiono anch'essi ordinati per data) o
un video non incorporabile (`videoEmbeddable`) — in entrambi i casi
l'`<iframe>` di `YouTubeLiveSection.tsx` mostrava un riquadro di errore
("Video non disponibile" / player rotto) al posto di un'anteprima valida.
In più, quando non c'era alcun video disponibile (nessuna API key in
sviluppo, fetch fallita, canale senza contenuti), il fallback puntava a
`youtube.com/embed/live_stream?channel=...`, che va esso stesso in errore
quando il canale non è in diretta in quel momento.

Fix:

- `route.ts`: la ricerca "latest" ora usa `videoEmbeddable=true` e
  richiede `maxResults=5` invece di `1`; i risultati vengono poi filtrati
  lato server escludendo gli id già presenti come diretta attiva o come
  eventi "upcoming" (richiesti separatamente), scegliendo così il primo
  video realmente concluso e incorporabile. Non è stato usato
  `eventType=completed` perché quel parametro dell'API YouTube restringe
  la ricerca ai soli broadcast (dirette), escludendo gli upload normali —
  errore di prima intenzione scartato durante l'implementazione
- `YouTubeLiveSection.tsx`: rimosso il fallback `embed/live_stream`;
  quando non c'è un video utilizzabile (`featuredVideo` nullo) il riquadro
  mostra ora un placeholder statico (pulsante play + link "Tutti i
  video") che porta al canale, invece di un iframe che può renderizzare
  un errore
- rimossa la costante `YOUTUBE_CHANNEL_ID` e la variabile `channelId`,
  diventate inutilizzate dopo la rimozione del fallback `live_stream`

Verificato in browser (senza `YOUTUBE_API_KEY` in locale, quindi in
condizione di fallback): il riquadro mostra il placeholder pulito con
pulsante play, non più un player rotto. Non verificato con una vera
`YOUTUBE_API_KEY` configurata in un ambiente con dati reali (nessuna
chiave disponibile in questa sessione locale) — da confermare in
produzione o in un ambiente con la chiave configurata.

### 10.6.3 Evidenziazione sidebar mentre si scorre (non solo al click)

Richiesta di follow-up: la voce "Orari settimanali" nella sidebar deve
evidenziarsi anche scorrendo semplicemente fino alla sezione `#orari`
nella home, non solo subito dopo un click sul link. Prima di questo fix,
`isActive()` in `SidebarDock.tsx`/`MobileDock.tsx` confrontava solo
`pathname === item.href`: per un item con `href="/#orari"` questo non è
mai vero (il pathname è `/`, l'href include l'hash), quindi "Orari" non
si accendeva mai da solo — "Home" restava evidenziato per l'intera
durata della permanenza su `/`, a prescindere dallo scroll.

Fix:

- nuovo hook `src/components/sidebar/useActiveHashSection.ts` (client):
  tiene traccia di quale sezione tracciata (per ora solo `#orari`) ha
  superato una "linea di attivazione" vicino alla cima del viewport
  (`ACTIVATION_OFFSET = 96px`, per restare sotto la navbar fissa) mentre
  l'utente scrolla sulla home; restituisce `null` quando nessuna sezione
  tracciata è nella zona attiva (es. in cima alla pagina, o su un'altra
  route)
- **Scelta tecnica**: aggiornamento via listener `scroll`/`resize` +
  `getBoundingClientRect()`, non `IntersectionObserver`. Prima
  implementazione con `IntersectionObserver` (pattern standard per
  scrollspy, `rootMargin` percentuale): verificata in browser reale
  (Chrome via MCP) il callback non scattava affatto nella tab usata per
  il test, perché la tab risultava `document.hidden === true` (finestra
  non a fuoco nel sistema) — Chrome mette in pausa/rallenta pesantemente
  gli `IntersectionObserver` nelle tab in background. Passato a un
  listener di scroll diretto per non dipendere da questo throttling (che
  colpirebbe anche utenti reali con più tab aperte e questa non a
  fuoco), verificato funzionante con scroll reali in tutti e tre i casi:
  scroll verso il basso fino a `#orari` → "Orari" si evidenzia e "Home"
  si spegne; scroll di ritorno in cima → torna "Home"; navigazione verso
  un'altra pagina (`/eventi`) → resta evidenziato "Eventi", non "Orari"
  né "Home"
- `SidebarDock.tsx` e `MobileDock.tsx`: `isActive()` ora, per un item con
  hash nell'`href`, confronta sia il path sia
  `activeHashSection === hash`; per l'item "Home" (`href="/"`), aggiunta
  la condizione `!activeHashSection` così non resta acceso quando lo
  scroll è già entrato in una sezione tracciata più sotto

Limite noto: `ACTIVATION_OFFSET` è un valore fisso (96px) pensato per
l'altezza attuale della navbar (`--topbar-height: 56px` + margine); se in
futuro cambia l'altezza della navbar o si aggiungono altre sezioni
tracciabili da sidebar (oggi solo `#orari`), va aggiornato o reso
dinamico leggendo `--topbar-height` da CSS.

---

## 10.7 Implementazione migliorie da audit generale (2026-09-12)

A seguito dell'audit generale del progetto, implementate le voci a basso
rischio/alto impatto senza bisogno di credenziali o decisioni esterne
(account Sentry, scelta di provider terzi non già in uso, ecc.).

### 10.7.1 SEO

- `src/lib/seo/metadata.ts`: helper `buildPageMetadata(namespace, titleKey,
  descriptionKey, path)` che costruisce `Metadata` (title, description,
  Open Graph, Twitter card, canonical) riusando le traduzioni next-intl già
  esistenti per pagina, invece di duplicare testo. Nota architetturale
  importante: il sito serve **un solo URL per pagina** e cambia lingua via
  cookie (`src/i18n/request.ts`), non via prefisso `/it`/`/ar` — quindi
  esiste un solo `canonical` per pagina indipendentemente dalla lingua
  (limite pre-esistente dell'architettura i18n, non qualcosa risolto qui:
  Google non può indorizzare separatamente la versione araba della stessa
  pagina).
- `generateMetadata()` aggiunto a: home, chi-siamo, contatti, eventi,
  icone, libreria, preghiere, video-corsi (quest'ultimo riusa
  deliberatamente il namespace `preghiere`/`sezioneVideoTitolo`, coerente
  con una scelta già presente nel codice della pagina, non un refuso
  introdotto qui). `/orari` escluso: la pagina fa solo `redirect("/#orari")`
  e non renderizza mai contenuto proprio.
- `src/app/layout.tsx`: `metadataBase` (da `NEXT_PUBLIC_SITE_URL`, con
  fallback), `title.template` per i title di sottopagina, Open Graph e
  Twitter card di default, `robots: { index: true, follow: true }`. Aggiunto
  anche un blocco JSON-LD (`schema.org` `PlaceOfWorship`) con indirizzo,
  logo e link social — dati statici noti (indirizzo da `Footer.tsx`/
  `contatti/page.tsx`), non input utente, quindi `dangerouslySetInnerHTML`
  qui non introduce rischio XSS.
- `src/app/sitemap.ts` e `src/app/robots.ts` (route handler nativi di
  Next.js, generati come statici in build — confermato in
  `npm run build`): l'elenco pagine pubbliche esclude deliberatamente
  `/orari` (redirect), `/iscrizioni` e `/profilo` (richiedono
  autenticazione, non hanno senso indicizzati) e tutto `/admin`/`/api`.

### 10.7.2 Middleware di sicurezza per le route admin

- Nuovo `src/middleware.ts` con `matcher: ["/api/admin/:path*"]`: verifica
  JWT (`verifyJwt`, Edge-compatibile via Web Crypto) e, quando Redis è
  configurato, la revoca token, **prima** che la richiesta raggiunga
  l'handler. Escluse esplicitamente `/api/admin/login` (deve restare
  raggiungibile senza sessione) e `/api/admin/logout` (deve poter pulire il
  cookie anche con un token scaduto/non valido, comportamento pre-esistente
  in `logout/route.ts`).
- **Scelta deliberata: additivo, non sostitutivo.** I controlli
  `requireAdminSession()`/`requireSuperAdminSession()` già presenti in ogni
  handler (17 file, vedi §6.4.1) NON sono stati rimossi: continuano a
  gestire la logica ruolo-specifica (es. route riservate al superadmin).
  Il middleware chiude solo il rischio descritto in §6.4.1 — una futura
  route admin aggiunta senza copiare il boilerplate di auth resterebbe
  comunque protetta, perché la richiesta non autenticata non raggiunge mai
  l'handler. Rimuovere la duplicazione nei singoli file sarebbe stato un
  refactor più ampio e rischioso (17 file da verificare uno per uno) non
  giustificato nello scope di questo intervento additivo.
- **Limite noto**: senza Redis configurato, la revoca-al-logout non è
  applicata a questo livello (il `Set` in-memoria di `session.ts` vive in
  un runtime/processo diverso da questo middleware Edge) — resta comunque
  applicata dal controllo per-route successivo nella stessa istanza. Con
  Redis configurato (vedi `REDIS_SETUP.md`) la revoca è invece effettiva
  già a livello di middleware.
- Verificato: `npm run build` mostra `ƒ Proxy (Middleware)` nell'output;
  testato in locale con `curl` — richiesta senza cookie di sessione a
  `/api/admin/eventi` → `401 {"success":false,"error":"Non autorizzato"}`;
  `/api/admin/login` con credenziali sbagliate → passa il middleware e
  arriva regolarmente all'handler (401 con messaggio "Credenziali non
  valide", non quello del middleware).

### 10.7.3 Prettier

- Aggiunti `.prettierrc.json` (con `prettier-plugin-tailwindcss` per
  l'ordinamento automatico delle classi Tailwind) e `.prettierignore`.
  Script `format`/`format:check` in `package.json`.
- **Scelta deliberata**: non è stata eseguita una riformattazione di massa
  dell'intero repository (avrebbe prodotto un diff enorme e scollegato dal
  lavoro reale, difficile da rivedere). Formattati solo i file toccati in
  questa sessione. Il resto della codebase seguirà gradualmente lo stile
  Prettier man mano che i file vengono modificati, oppure può essere
  riformattato in blocco con `npm run format` in un commit dedicato e
  isolato, quando/se lo si desidera.

### 10.7.4 Test automatici (Vitest)

- Il progetto non aveva alcun test. Aggiunto `vitest` (v2, compatibile con
  `@types/node` ^20 già in uso — l'ultima major richiede `@types/node`
  ^22/^24, upgrade non necessario per questo intervento) + `vitest.config.ts`
  con alias `@` coerente con `tsconfig.json`. Script `test`/`test:watch`/
  `test:coverage`.
- Due suite iniziali su funzioni pure e critiche per la sicurezza, scelte
  perché testabili senza mock di database esterni:
  - `src/lib/auth/jwt.test.ts`: round-trip firma/verifica, token scaduto
    rifiutato, firma manomessa rifiutata, secret diversa rifiutata, token
    malformati rifiutati.
  - `src/lib/auth/rate-limit.test.ts`: blocco dopo 5 tentativi falliti,
    conteggio tentativi rimanenti, reset dopo login riuscito, isolamento
    tra IP diversi, stesso pattern per il rate limit delle richieste
    generiche (60/minuto). Esercita il percorso di fallback in-memoria
    (nessuna istanza Redis nell'ambiente di test).
  - 10/10 test passano; `tsc --noEmit` e `eslint` puliti sui nuovi file.
- **Non fatto in questo intervento** (scope volutamente limitato): test di
  integrazione sulle route API (richiederebbero mock di Supabase/MongoDB),
  test end-to-end (Playwright), CI/GitHub Actions per eseguire i test
  automaticamente sui push/PR — indicati come lavoro futuro.

### 10.7.5 Non implementato in questo intervento (richiede input dell'utente)

- **Error tracking (Sentry o equivalente)**: richiede la creazione di un
  account e una DSN da parte dell'utente — non è stata creata alcuna
  integrazione "vuota" per evitare dipendenze inutilizzabili senza
  configurazione. Quando disponibile, l'integrazione è standard
  (`@sentry/nextjs`, wizard di setup automatico).
- **Consolidamento completo di `requireAdminSession()`** (rimozione della
  duplicazione nei 17 file, non solo rete di sicurezza aggiuntiva): fuori
  scope per rischio di regressione, vedi §10.7.2.
- **Verifica diff completo delle chiavi di traduzione IT/AR**: non
  eseguita in questo giro (richiederebbe un confronto programmatico
  `it.json`/`ar.json` fuori scope qui).
- **`MONGODB_COLD_START_FIX.md`**: non riletto in questo intervento per
  verificare se il fix documentato sia ancora applicato nel codice attuale
  o solo storico.

---

## 10.8 Unificazione stili cross-pagina (2026-09-12)

Audit dedicato (richiesto esplicitamente dall'utente) per catalogare e
unificare ogni incoerenza di stile tra pagine diverse per elementi simili
(bottoni, badge, card, input, stati vuoti). Ambito: solo pagine pubbliche
e componenti pubblici condivisi — `src/app/admin/**` non toccato (già
consolidato in un audit precedente, §6.4.2).

### Nuove classi condivise in `src/app/globals.css`

| Classe | Uso |
|---|---|
| `.input-field` | Standard unico per input/select/textarea: bordo `border-border`, focus **sempre oro** (`ring-gold/30`, `border-gold`) |
| `.empty-state` | Stato vuoto standard: `rounded-2xl border-dashed border-border bg-surface px-6 py-12` |
| `.badge-success` / `.badge-danger` / `.badge-neutral` | Badge di stato, usano i token `--color-success`/`--color-danger` già esistenti ma prima mai usati fuori da un paio di punti isolati |
| `.badge-tag` | Badge "categoria contenuto" (icone/libreria/preghiere/video-corsi), stile box preso da `IconeGrid.tsx` (`bg-surface/90 border-border/60 rounded-md text-accent`) |
| `.badge-tipo-self` / `.badge-tipo-altro` / `.badge-tipo-famiglia` | Badge tipo-iscrizione — **decisione utente**: sostituire ambra/cielo/smeraldo (fuori palette) con tonalità di accent/primary/surface-2 già esistenti, non con un badge neutro unico |
| `.icon-box` / `.icon-box-circle` | Pattern "icona con bordo/sfondo accent", riutilizzabile invece di riscrivere `border border-accent/40`/`rounded-full bg-accent/10` a mano ad ogni pagina |
| `.btn-option-card` | Card cliccabile stile bottone (usata nel modale iscrizioni per "Per me/Per un altro/Per famiglia") |

**Bug introdotto e corretto durante l'implementazione**: il commento CSS
per `.icon-box` conteneva la sequenza `*/` al suo interno
(`(h-*/w-*)`), chiudendo il commento CSS prematuramente e rompendo il
parsing dell'intero `globals.css` in dev (`next dev` restituiva 500 su
ogni pagina — build di produzione non lo segnalava, solo Turbopack dev
in modalità strict). Scoperto e corretto rileggendo il log del dev
server dopo la prima verifica visiva; riavviato il dev server e
riconfermato 200 su tutte le pagine testate.

### Decisioni di design prese dall'utente (vincolanti per questo intervento)

- Badge tipo-iscrizione: varianti della palette esistente (non un badge
  neutro unico) — vedi tabella sopra.
- Bottoni sezione YouTube (rosso, brand legittimo): allineato il
  `border-radius` a `rounded-xl` come `.btn-primary`; il colore rosso non
  è stato toccato.

### Fix del problema più visibile: focus ring input in `profilo/page.tsx`

La sezione "modifica profilo admin" usava `focus:ring-gold`, la sezione
"modifica profilo utente normale" (stessi campi: nome, cognome, email,
username) usava `focus:ring-primary` (blu) — unica incoerenza
riscontrata **dentro la stessa pagina**. Tutti gli `<input>` del file
sono stati portati a `focus:ring-gold/20 focus:border-gold`: le due
sezioni ora si comportano in modo identico. Stesso fix applicato a tutti
gli input del modale iscrizioni in `EventiList.tsx` (che usava
`ring-primary/20` ovunque) e ai due `<select>`/radio non testuali dove
pertinente.

### File modificati per categoria

- **Bottoni**: `Footer.tsx` (era `rounded-full` custom → `.btn-primary`/`.btn-secondary`), `ComingSoonPage.tsx` e `auth/AdminGate.tsx` (componenti duplicati con bottone "torna home" identico, entrambi → `.btn-primary`, mancava anche il focus-visible ring), `EventiList.tsx` (guest-gate login/registrati: era `bg-primary` blu → `.btn-primary`/`.btn-secondary` oro; le 3 card "Per me/Altro/Famiglia" → `.btn-option-card`; bottone "torna a scelta" → aggiunto focus-visible ring mancante), `YouTubeLiveSection.tsx` (border-radius allineato, colore rosso invariato), `ScrollDownHint.tsx` (aggiunto focus-visible ring mancante).
- **Badge categoria contenuto**: `IconeGrid.tsx`, `libreria/page.tsx`, `preghiere/page.tsx`, `video-corsi/page.tsx` → tutti su `.badge-tag`.
- **Badge tipo-iscrizione**: `iscrizioni/page.tsx` e `profilo/page.tsx` (funzione `getRegistrationTypeInfo`) → tonalità accent/primary/surface-2.
- **Stati vuoti + i18n**: `libreria/page.tsx`, `preghiere/page.tsx`, `video-corsi/page.tsx` → `.empty-state` + nuove chiavi i18n (sotto); `page.tsx` (home) → testo hardcoded sostituito con chiave i18n esistente/nuova, nessun cambio di markup (contesto diverso, dentro una card già esistente).
- **Card griglia libreria**: `rounded-xl` → `rounded-2xl` per allinearsi a eventi/icone (stessa struttura di card).
- **Refactor esteso `profilo/page.tsx` (~1220 righe)**: migrati tutti i colori hardcoded (`bg-white`, `text-gray-*`, `border-gray-*`, `bg-blue-50`, `bg-green-50`, `bg-red-50`, `bg-purple-50`, `bg-teal-50`, `bg-indigo-50`, `bg-violet-50`) ai token semantici (`bg-surface`, `text-foreground/*`, `border-border`, `bg-accent/10`, `.badge-success`/`.badge-danger`, `bg-primary/10`). La lista "azioni rapide sito" (4 link con 4 hue diverse senza significato semantico) unificata a due sole tonalità alternate (accent/primary).
- **Refactor esteso `EventiList.tsx` modale (~500 righe)**: stessa migrazione di colori (gray/red/green/amber → foreground/danger/success/warning), tutti gli input unificati su focus oro.
- **Componenti auth**: `UserMenu.tsx`, `RegisterModal.tsx`, `LoginModal.tsx` — colori hardcoded (incluse istanze scritte come hex letterali `bg-[#D97706]`/`bg-[#0F1A2E]`, numericamente già identiche ai token `gold-light`/`primary` ma scritte a mano) migrate ai token; aggiunto focus-visible ring mancante sul bottone menu utente.
- **Altri componenti con colori fuori palette non esplicitamente elencati nella richiesta iniziale ma trovati durante lo sweep finale**: `icone/[slug]/page.tsx`, `libreria/[slug]/page.tsx` (pagine di dettaglio, dimenticate nel primo giro), `loading.tsx` (skeleton), `BackLink.tsx`, `IconaQRSection.tsx`, `RelatedResourceCard.tsx` — tutti migrati con lo stesso mapping gray→foreground/border/surface. `PreghiereTabs.tsx` migrato anch'esso, ma **risulta non importato/non usato da nessuna pagina** (componente morto, probabilmente superato da `preghiere/page.tsx` + `video-corsi/page.tsx` separate) — segnalato qui, non rimosso perché rimuovere codice non richiesto era fuori scope di un intervento di solo styling.
- `PreghieraExpand.tsx`: `bg-gray-50`/`border-gray-100`/`text-gray-700` → `bg-surface-2`/`border-border`/`text-foreground/80`.

### Chiavi i18n aggiunte (it.json + ar.json)

- `libreria.statoVuoto`
- `preghiere.statoVuoto`
- `preghiere.sezioneVideoStatoVuoto` (usata da `video-corsi/page.tsx`, che riusa il namespace `preghiere` per coerenza con `sezioneVideoTitolo` già esistente)
- `home.nessunaPreghiera`

### Cosa NON è stato toccato (intenzionale)

- Alternanza quadrato/cerchio in `preghiere/page.tsx` (`isSquareIcon = index % 2 === 0`, colore primary non accent) e pillar primario/secondario in `chi-siamo/page.tsx`: variazione compositiva intenzionale confermata dall'audit, lasciata invariata.
- Icone-in-box `rounded-lg` (non circolari) in `profilo/page.tsx`: erano già strutturalmente coerenti tra loro (stessa forma/dimensione), l'unico problema era il colore — corretto senza forzarle in `.icon-box-circle` (che avrebbe cambiato la forma da quadrata a circolare, una modifica visiva non richiesta).
- Radio button "punto di raccoglimento" in `EventiList.tsx` (usa `border-primary`/`text-primary` per lo stato selezionato): pattern di selezione, non un campo di testo — lasciato con l'accento primary come colore di stato "selezionato", distinto dal focus-ring oro standard.
- Spaziatura tra sezioni (`space-y-8` vs `space-y-12`/`14`): l'audit ha concluso che la variazione è già coerente con la complessità di ciascuna pagina (pagine-lista vs pagine editoriali multi-sezione), nessuna azione necessaria.
- Diff completo delle traduzioni it/ar oltre alle 4 chiavi aggiunte qui: non eseguito, resta lavoro futuro.

### Verifiche eseguite

- `npx tsc --noEmit` pulito
- `npx eslint` su tutti i file toccati: 0 errori, solo warning preesistenti non introdotti in questo intervento (uso di `<img>` invece di `next/image`, variabili non usate già presenti prima)
- `node -e "JSON.parse(...)"` su `it.json`/`ar.json`: entrambi validi
- `npm run build`: completa senza errori (dopo il fix del bug `*/` descritto sopra)
- Verifica visiva in browser (Chrome via MCP) su home, eventi (guest-gate), icone e libreria (entrambe attualmente in stato "coming soon" lato pubblico) — tutte renderizzano correttamente coi nuovi stili, nessun errore runtime
- **Non verificato visivamente**: profilo (richiede sessione utente autenticata, non disponibile in questa sessione), il modale di iscrizione eventi (richiede login), le pagine in lingua araba con i nuovi stili

### 10.8.1 Verifica indipendente aggiuntiva (2026-09-12)

Dopo il completamento del punto precedente, eseguita una seconda verifica
indipendente per coprire proprio i due limiti segnalati sopra (`/profilo`
e stato autenticato):

- `tsc --noEmit`, `eslint` (su `src/app` e `src/components` per intero) e
  `npm run build` ri-eseguiti da zero: puliti. I 3 errori/warning residui
  (`registrations-utils.ts`, `api/admin/iscrizioni/route.ts`,
  `SidebarContext.tsx`) sono confermati pre-esistenti e non toccati in
  questo intervento (verificato con `git status` sui singoli file).
- Creato un utente di test temporaneo via `POST /api/auth/register`,
  login via `POST /api/auth/login`, verifica visiva di `/profilo` in
  browser reale: il fix più importante dell'audit (focus ring oro nella
  sezione admin vs blu nella sezione utente normale, sugli stessi campi)
  è confermato risolto — letto `className` reale degli `<input>` via
  JS: tutti riportano `focus:ring-gold/20 focus:border-gold`, nessuna
  occorrenza di `ring-primary` rimasta.
- L'utente di test è stato eliminato subito dopo la verifica (script
  temporaneo one-off con `deleteUser()`, poi rimosso) per non lasciare
  dati fittizi nella collezione MongoDB reale, coerente con la policy
  "nessun seed demo" del progetto (§11).
- **Ancora non verificato**: il modale di iscrizione evento (richiede
  un evento pubblicato e superare il gate `SectionVisibilityGate`, non
  praticabile rapidamente in questa sessione) e la resa in arabo.

---

## 11. Note operative

- L'area admin è la fonte primaria per creare contenuti iniziali.
- Se una collezione è vuota, la UI deve mostrare uno stato vuoto o una vista compatibile, non dati inventati.
- Il repository contiene ancora alcuni layer legacy di compatibilità con Supabase, ma il flusso dominante oggi è MongoDB per i contenuti e Supabase per gli admin.
- `src/lib/mock-data.ts` non è più parte del flusso applicativo.

---

## 12. Comandi rapidi

```bash
npm install
npm run dev
npm run build
npm run lint
```

Per l'hash bcrypt iniziale di un admin:

```bash
npm run generate-hash -- "la-tua-password"
```