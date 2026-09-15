# ☦ Chiesa di San Marco – Sito Web

Sito web bilingue (italiano/arabo) per la **Chiesa Copta Ortodossa di San Marco** a Milano.  
Include un'area pubblica per i fedeli e un pannello admin per la gestione dei contenuti.

## Stack tecnologico

| Tecnologia | Scopo |
|---|---|
| **Next.js 16** (App Router) | Framework React |
| **TypeScript** | Linguaggio |
| **TailwindCSS v4** | Styling (`@theme` syntax) |
| **next-intl** | Internazionalizzazione IT/AR |
| **Supabase** | Database PostgreSQL + Auth |
| **bcryptjs** | Hashing password |
| **lucide-react** | Icone SVG |
| **Resend** | Invio email transazionali auth/security (reset password) |
| **Brevo** | Invio email eventi/comunicazioni (predisposto, non ancora attivo) |

## Funzionalità

- **Sito pubblico** bilingue IT/AR — 8 pagine (home, chi siamo, orari, icone, libreria, eventi, preghiere + pagine dettaglio)
- **Pannello admin** con CRUD completo per tutti i contenuti (libreria, icone, orari, eventi, preghiere, libreria privata)
- **Gestione utenti admin** (solo superadmin)
- **Autenticazione** completa su Supabase (login, sessioni DB, middleware, rate limiting)
- **Responsive** su mobile, tablet e desktop (sia sito pubblico che admin)
- **Password dimenticata** — reset password via email per gli utenti normali (`/forgot-password`, `/reset-password`)

## Setup

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

Crea un file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=       # URL progetto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Chiave pubblica anon
SUPABASE_SERVICE_ROLE_KEY=      # Chiave server (secret)
ADMIN_SESSION_SECRET=           # Stringa random per sessioni
MONGODB_URI=                    # Connessione MongoDB (utenti, iscrizioni, contenuti)
NEXT_PUBLIC_SITE_URL=           # Base URL del sito, usata anche nei link email (es. reset password)
```

Per la lista completa (incluse le variabili Resend/Brevo e OAuth, opzionali) vedi `.env.example`.

### 3. Setup database

Esegui lo schema SQL su Supabase (vedi `src/lib/supabase/schema.sql`) per creare le tabelle `admin_users` e `admin_sessions`.

Per creare il primo utente admin, genera un hash bcrypt e inseriscilo manualmente:

```bash
npm run generate-hash -- "la-tua-password"
```

### 4. Avvia il dev server

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia server di sviluppo |
| `npm run build` | Build di produzione |
| `npm start` | Avvia in produzione |
| `npm run lint` | Linting |
| `npx tsc --noEmit` | Type-check senza generare output |
| `npm run format` | Formatta il codice con Prettier |
| `npm run format:check` | Verifica la formattazione senza modificare i file |
| `npm test` | Esegue i test automatici (Vitest) |
| `npm run test:watch` | Test in modalità watch |
| `npm run generate-hash -- "pwd"` | Genera hash bcrypt |

## Struttura progetto

```
src/
├── app/
│   ├── (main)/          # Sito pubblico (8 pagine)
│   ├── admin/
│   │   ├── login/       # Pagina login
│   │   └── (dashboard)/ # Pagine admin protette
│   └── api/             # API routes (auth + CRUD)
├── components/          # Componenti React (pubblici + admin)
├── lib/                 # Auth, DB, store dati, utilities
├── messages/            # Traduzioni (it.json, ar.json)
└── types/               # Tipi TypeScript
```

> Per una documentazione dettagliata del progetto, vedi `PROJECT_CONTEXT.md`.

## Password dimenticata e servizio email

Il sito invia email transazionali tramite due provider distinti, uno per categoria (nessun invio doppio):

- **Resend** — email di autenticazione/sicurezza: reset password (l'unico flusso attivo oggi).
- **Brevo** — email eventi/comunicazioni: conferma iscrizione, promemoria, newsletter. Il modulo è predisposto (`src/lib/email/brevo.ts` e i template in `src/lib/email/templates/`) ma **non ancora collegato** a nessun flusso reale di prenotazione/evento.

### Configurazione in sviluppo

1. Crea un account [Resend](https://resend.com) (piano gratuito sufficiente per lo sviluppo) e genera una API key.
2. Imposta in `.env.local`:
   ```env
   RESEND_API_KEY=re_...
   EMAIL_FROM_AUTH=onboarding@resend.dev   # o un dominio verificato su Resend
   EMAIL_REPLY_TO=
   PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60
   ```
3. Senza `RESEND_API_KEY`, il flusso di reset password **funziona comunque**: l'API restituisce sempre la stessa risposta generica al client, ma l'invio viene saltato e loggato come `provider_not_configured` invece di lanciare un errore. Utile per sviluppare senza inviare email reali.
4. Per Brevo (solo se stai lavorando sui template eventi, non necessario per il reset password): crea un account [Brevo](https://www.brevo.com) e imposta `BREVO_API_KEY`, `EMAIL_FROM_EVENTS`, `EMAIL_FROM_NEWSLETTER`.

### Flusso "Password dimenticata?"

1. L'utente clicca "Password dimenticata?" nel modal di login → `/forgot-password`.
2. Inserisce l'email → `POST /api/auth/forgot-password`. La risposta è **sempre identica** (generica), che l'indirizzo esista o meno, per non rivelare quali email sono registrate.
3. Se l'utente esiste, riceve una email Resend con un link `NEXT_PUBLIC_SITE_URL/reset-password?token=...` valido per `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` (default 60 minuti, monouso).
4. Su `/reset-password`, imposta la nuova password → `POST /api/auth/reset-password`. Il reset invalida il token, imposta la nuova password e disconnette tutte le altre sessioni attive dell'utente (vedi `PROJECT_CONTEXT.md` per il meccanismo `passwordChangedAt`).

### Variabili su Vercel

Configura le stesse variabili di `.env.example` per gli ambienti **Development**, **Preview** e **Production** nel dashboard Vercel del progetto. `RESEND_API_KEY`/`BREVO_API_KEY` possono restare vuote in Preview se non vuoi inviare email reali dai deploy di anteprima (il fallback `provider_not_configured` si applica anche lì).

### Dominio mittente e DNS (produzione)

Prima di andare in produzione con un dominio proprio:

- Verifica il dominio (o un sottodominio dedicato, es. `auth.tuodominio.it`) sia su Resend che su Brevo.
- Configura **SPF**: aggiungi/aggiorna il record TXT del dominio per includere gli host di invio di entrambi i provider (Resend e Brevo forniscono il valore esatto nel loro pannello DNS).
- Configura **DKIM**: aggiungi i record CNAME/TXT forniti da ciascun provider per firmare le email in uscita.
- Configura **DMARC**: aggiungi un record `_dmarc` con una policy (almeno `p=none` per monitorare, poi `p=quarantine`/`p=reject` una volta verificato che la posta legittima passi).
- Imposta `EMAIL_FROM_AUTH`/`EMAIL_FROM_EVENTS`/`EMAIL_FROM_NEWSLETTER` su indirizzi del dominio verificato (es. `noreply@auth.tuodominio.it`), non su un indirizzo Gmail personale — un indirizzo Gmail personale come mittente in produzione non supera i controlli SPF/DKIM allineati al dominio del sito e mina la deliverability.
- `EMAIL_REPLY_TO`, se impostato, deve essere una casella di posta realmente monitorata.

### Limiti dei piani gratuiti

Resend e Brevo hanno entrambi un piano gratuito con un tetto giornaliero/mensile di invii — sufficiente per lo sviluppo e per basso volume in produzione, ma da monitorare se il traffico cresce (in particolare per newsletter/promemoria via Brevo, quando verranno attivati).

## Note

- I contenuti del sito sono attualmente in memoria e si resettano al riavvio del server. Solo l'autenticazione è persistita su Supabase.
- L'area admin è solo in italiano.
- Il file `.env.local` **non** deve essere committato.
