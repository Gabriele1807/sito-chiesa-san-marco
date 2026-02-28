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

## Funzionalità

- **Sito pubblico** bilingue IT/AR — 8 pagine (home, chi siamo, orari, icone, libreria, eventi, preghiere + pagine dettaglio)
- **Pannello admin** con CRUD completo per tutti i contenuti (libreria, icone, orari, eventi, preghiere, libreria privata)
- **Gestione utenti admin** (solo superadmin)
- **Autenticazione** completa su Supabase (login, sessioni DB, middleware, rate limiting)
- **Responsive** su mobile, tablet e desktop (sia sito pubblico che admin)

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
```

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

## Note

- I contenuti del sito sono attualmente in memoria e si resettano al riavvio del server. Solo l'autenticazione è persistita su Supabase.
- L'area admin è solo in italiano.
- Il file `.env.local` **non** deve essere committato.
