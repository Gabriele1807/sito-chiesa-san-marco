# ☦ Chiesa Copta Ortodossa di San Marco – Milano

Il sito web ufficiale della **Chiesa Copta Ortodossa di San Marco** di Milano: un punto di riferimento per la comunità, in **italiano e arabo** (con layout da destra a sinistra), pensato prima di tutto per essere usato dal telefono e installabile come app.

Chi visita il sito trova gli orari delle celebrazioni, le preghiere, le icone, la libreria e i corsi, può iscriversi agli eventi e seguire le liturgie dal canale YouTube. Chi gestisce la parrocchia ha un pannello dedicato per tenere tutto aggiornato senza toccare il codice.

## Per i fedeli

- **Orari e prossima celebrazione** – orari settimanali e calendario copto, con la prossima celebrazione sempre in evidenza.
- **Preghiere, icone e libreria** – testi di preghiera, galleria di icone con QR code, libreria di documenti; una parte dei contenuti è riservata agli utenti registrati.
- **Eventi e iscrizioni** – iscrizione online, email di conferma e promemoria prima dell'evento.
- **Video e canale YouTube** – ultimo video e dirette direttamente nella home, più la sezione dei video corsi.
- **Avvisi** – comunicazioni della parrocchia, anche urgenti, con notifiche push.
- **Richieste di preghiera** – un modulo per affidare un'intenzione alla comunità.
- **Account** – registrazione con email oppure con **Google** e **Facebook**, verifica dell'email, profilo e recupero password.
- **App installabile (PWA)** – si aggiunge alla schermata home, funziona anche con connessione debole e invia notifiche.

## Per chi gestisce il sito

- Pannello admin (in italiano) per creare e modificare orari, preghiere, icone, libreria, eventi, video corsi e avvisi.
- Gestione delle **iscrizioni** agli eventi, con esportazione.
- **Statistiche** sull'utilizzo e sulle iscrizioni.
- **Registro delle attività**: chi ha fatto cosa e quando.
- Ruoli e permessi per gli amministratori, e controllo di quali sezioni del sito sono visibili.

## Tecnologie

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · next-intl · MongoDB · Supabase (account admin) · Upstash Redis · Resend · Web Push · Vercel.

Sicurezza curata a più livelli: sessioni firmate e revocabili, rate limiting, accesso OAuth con PKCE e controlli su ogni redirect, e una suite di test automatici (Vitest).

## Documentazione

Chi vuole avviare o far evolvere il progetto trova i dettagli qui:

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) – architettura, route, modello dati e flussi di autenticazione
- [`.env.example`](.env.example) – variabili d'ambiente
- [`VERCEL_DEPLOYMENT_GUIDE.md`](VERCEL_DEPLOYMENT_GUIDE.md) – pubblicazione su Vercel
- [`docs/OAUTH_SETUP.md`](docs/OAUTH_SETUP.md) e [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) – accesso con Google/Facebook ed email transazionali

Per provarlo in locale: `npm install`, configura `.env.local` a partire da `.env.example`, poi `npm run dev`.

---

*Progetto realizzato per la comunità della Chiesa Copta Ortodossa di San Marco, Milano.*
