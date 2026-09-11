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
```

Note operative:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` alimentano il layer admin Supabase.
- `ADMIN_SESSION_SECRET` firma la sessione admin JWT.
- `MONGODB_URI` e `MONGODB_DB` alimentano MongoDB per contenuti, utenti e iscrizioni.
- `NEXT_PUBLIC_SITE_URL` viene usato per costruire URL assoluti in alcune API.
- `YOUTUBE_API_KEY` alimenta l'endpoint del canale YouTube.

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