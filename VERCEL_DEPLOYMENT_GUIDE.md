# Guida al deploy su Vercel

Checklist operativa per pubblicare il sito su Vercel. Aggiornata al 2026-09-26
(branch `claude/eager-bardeen-h13079`). Nessun valore segreto in questo file:
i nomi delle variabili sono descritti in `.env.example`.

Per i dettagli tecnici del retry MongoDB vedi `MONGODB_COLD_START_FIX.md`;
per OAuth `docs/OAUTH_SETUP.md`; per l'email `docs/EMAIL_SETUP.md`; per il
primo admin `ADMIN_SETUP.md`.

---

## 0. Da fare subito, prima di qualsiasi deploy (sicurezza)

Il repository GitHub è **pubblico**. Fino al 2026-09-26 `test-mongodb.js`
conteneva la stringa di connessione MongoDB Atlas dell'utente `admin` con la
password in chiaro. È stata rimossa dal codice, ma **resta nella cronologia
Git** e va considerata compromessa.

1. **MongoDB Atlas → Database Access**: cambia la password dell'utente
   `admin` (o eliminalo) e crea un utente dedicato all'app con il solo ruolo
   `readWrite` sul database dell'app (non `atlasAdmin`).
2. **Atlas → Network Access**: su Vercel gli IP in uscita non sono fissi, per
   questo spesso si usa `0.0.0.0/0`. È accettabile solo con una password nuova,
   lunga e casuale e con un utente a privilegi minimi.
3. **Atlas → Project → Activity Feed / log di accesso**: controlla accessi o
   operazioni anomale dal luglio 2026 in poi.
4. Aggiorna `MONGODB_URI` ovunque sia configurata (Vercel, `.env.local`).
5. Se il superadmin è stato creato con la password d'esempio che compariva
   nello schema (`sanmarco2026`), cambiala subito dal profilo.
6. (Facoltativo) Rimuovere la password anche dalla cronologia richiede una
   riscrittura della history (`git filter-repo`) e un force push su `main`:
   operazione distruttiva, da valutare a parte. La rotazione del punto 1 è
   sufficiente a neutralizzare il rischio.

---

## 1. Impostazioni del progetto Vercel

| Voce | Valore |
|---|---|
| Framework preset | Next.js (anche `vercel.json` → `"framework": "nextjs"`) |
| Build command | `next build` (da `vercel.json`) |
| Install command | default (`npm install`); `package-lock.json` è sincronizzato e `npm ci` funziona |
| Output directory | default di Next.js (non impostarla) |
| Node.js version | 22.x (verificato in locale con Node 22 + npm 10; Next 16 richiede ≥ 20.9) |
| Root directory | radice del repository |
| Function max duration | 60 s per `src/app/api/**` (da `vercel.json`) |

Nessun cron job, webhook o storage di file locale è richiesto dall'app.

---

## 2. Variabili d'ambiente su Vercel

Project → Settings → Environment Variables. Marca come **Sensitive** tutte le
chiavi/segreti. Dopo ogni modifica serve un **nuovo deploy** (le
`NEXT_PUBLIC_*` sono incorporate al momento della build).

| Variabile | Production | Preview | Scopo |
|---|---|---|---|
| `MONGODB_URI` | ✅ obbligatoria | ✅ obbligatoria (build) — meglio un cluster/DB separato | Database contenuti, utenti, iscrizioni |
| `MONGODB_DB` | ✅ | ✅ (es. nome diverso per i preview) | Nome database |
| `ADMIN_SESSION_SECRET` | ✅ obbligatoria | ✅ (valore diverso) | Firma JWT sessioni e cookie OAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ obbligatoria | ✅ | Progetto Supabase (admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ obbligatoria | ✅ | Accesso server a `admin_users` |
| `NEXT_PUBLIC_SITE_URL` | ✅ obbligatoria (`https://dominio-definitivo`, senza `/` finale) | ❌ lasciare vuota | Link email e redirect OAuth |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` (oppure `KV_REST_API_URL` / `_TOKEN`) | ✅ consigliata | facoltativa | Rate limit e revoca sessioni admin condivisi |
| `RESEND_API_KEY` | ✅ per il reset password | ❌ | Invio email |
| `EMAIL_FROM_AUTH` | ✅ obbligatoria se c'è Resend | ❌ | Mittente (dominio verificato) |
| `EMAIL_REPLY_TO` | facoltativa | ❌ | Indirizzo di risposta |
| `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES` | facoltativa (default 60) | — | Validità link reset |
| `GOOGLE_CLIENT_ID` / `_SECRET` | facoltative | ❌ | Login con Google |
| `FACEBOOK_CLIENT_ID` / `_SECRET` | facoltative | ❌ | Login con Facebook |
| `YOUTUBE_API_KEY` | facoltativa | facoltativa | Video in home |
| `EMAIL_FROM_EVENTS` | facoltativa (default `EMAIL_FROM_AUTH`) | ❌ | Mittente conferme e promemoria eventi |
| `BREVO_API_KEY` | facoltativa | ❌ | Se presente con `EMAIL_FROM_EVENTS`, le email eventi passano da Brevo |
| `CRON_SECRET` | ✅ per i promemoria | ❌ | Protegge `/api/cron/event-reminders` (Vercel Cron, `vercel.json`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | facoltative (servono tutte e tre per le notifiche push) | ❌ | Notifiche degli avvisi; generare con `npm run generate-vapid-keys` |
| `EMAIL_FROM_NEWSLETTER`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ non usate dal codice | ❌ | — |

Perché i Preview senza `NEXT_PUBLIC_SITE_URL`, OAuth e Resend: gli URL dei
preview cambiano a ogni deploy, quindi non corrispondono alle callback
registrate sui provider, e i link di reset punterebbero al dominio sbagliato.
Senza queste variabili, in produzione (i preview girano con
`NODE_ENV=production`) OAuth risulta "non disponibile" e il reset password
non invia email: entrambi i casi sono segnalati nei log, senza errori per
l'utente. Se i preview usano lo **stesso** database di produzione, ogni prova
su un preview modifica dati reali.

---

## 3. Servizi esterni (in quest'ordine)

1. **Dominio**: aggiungi il dominio definitivo in Vercel → Domains e
   configura il DNS come indicato da Vercel. Poi imposta
   `NEXT_PUBLIC_SITE_URL` su quel dominio (con `https://`, senza `/` finale).
2. **Supabase → SQL Editor**, sul database esistente:
   ```sql
   ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
   ```
   (già inclusi in `src/lib/supabase/schema.sql` per le nuove installazioni;
   l'app usa la service role e non ne è influenzata). Verifica che esista
   almeno un superadmin attivo con password robusta.
3. **Upstash Redis**: collega un database (Vercel → Storage/Marketplace
   crea automaticamente `KV_REST_API_URL`/`KV_REST_API_TOKEN`).
4. **Resend**: verifica il dominio mittente (record SPF, DKIM, DMARC:
   `docs/EMAIL_SETUP.md`), crea una API key con permesso "Sending access",
   imposta `EMAIL_FROM_AUTH` su un indirizzo di quel dominio.
5. **Google Cloud Console** → Credentials → OAuth client (Web):
   - Authorized redirect URI: `https://<dominio>/api/auth/oauth/google/callback`
   - OAuth consent screen: link a Home, **Privacy** (`https://<dominio>/privacy`)
     e **Termini** (`https://<dominio>/termini`); pubblica l'app ("In
     production"), altrimenti accedono solo gli utenti di test.
6. **Meta for Developers** (Facebook Login):
   - Valid OAuth Redirect URI: `https://<dominio>/api/auth/oauth/facebook/callback`
   - App settings → Basic: Privacy Policy URL `https://<dominio>/privacy`,
     Terms of Service URL `https://<dominio>/termini`, "User data deletion" →
     istruzioni: `https://<dominio>/privacy#diritti` (richiesto da Meta per
     andare Live).
   - Passa l'app in modalità **Live**. Se è attivo "Require App Secret" va
     bene: il codice invia `appsecret_proof`.
7. **YouTube Data API** (facoltativa): limita la API key alla sola "YouTube
   Data API v3".
8. **MongoDB**: nessuna migrazione da eseguire. Gli indici vengono creati
   dall'app al primo uso (incluso `username_ci_unique`). Script facoltativo e
   idempotente: `npm run backfill-has-password` (con `MONGODB_URI` di
   produzione, solo se vuoi rendere esplicito `hasPassword`).
9. **Promemoria degli eventi (Vercel Cron)**: `vercel.json` programma
   `/api/cron/event-reminders` ogni giorno alle 16:00 UTC (17 o 18 in Italia).
   Imposta `CRON_SECRET` (es. `openssl rand -hex 32`) nelle variabili di
   Production: Vercel la invia da solo al job; senza, il job risponde 503 e
   non invia nulla. I cron partono solo sul deploy di produzione e sono
   visibili in Settings → Cron Jobs.
10. **Notifiche push** (facoltative): `npm run generate-vapid-keys`, poi
    copia la chiave pubblica in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, quella privata
    in `VAPID_PRIVATE_KEY` e un contatto in `VAPID_SUBJECT`
    (`mailto:indirizzo@dominio`). Serve un Redeploy (variabile `NEXT_PUBLIC_`).
    Cambiare le chiavi in seguito invalida le iscrizioni esistenti: gli utenti
    dovranno riattivare le notifiche.

---

## 4. Pubblicazione

1. Rivedi e unisci la PR su `main`: Vercel crea il deploy di produzione.
   In alternativa verifica prima il deploy di Preview della PR.
2. Se hai cambiato variabili dopo l'ultimo build: Deployments → ultimo
   deploy → **Redeploy** (senza cache se hai cambiato `NEXT_PUBLIC_*`).

---

## 5. Verifiche subito dopo il primo deploy (sul dominio pubblico)

| # | Verifica | Esito atteso |
|---|---|---|
| 1 | Apri `/`, `/chi-siamo`, `/privacy`, `/termini` in IT e AR | Pagine visibili, arabo da destra a sinistra |
| 2 | `curl -sI https://<dominio>/` | Header `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`; nessun `X-Powered-By` |
| 3 | `curl -s -o /dev/null -w "%{http_code}" https://<dominio>/api/admin/eventi` | `401` |
| 4 | Registrazione classica + login + logout | Funzionano; sessione mantenuta tra le pagine |
| 5 | Profilo → cambio password | Resti connesso; su un altro browser la vecchia sessione non vale più |
| 6 | "Password dimenticata?" con un tuo account | Email ricevuta (controlla anche lo spam) nella lingua del sito; link apre `/reset-password`, reset riuscito, login con la nuova password |
| 7 | Login con Google e con Facebook (account nuovo e già collegato) | Redirect al provider e ritorno sul sito loggati; collegamento/scollegamento dal profilo |
| 8 | Admin: login, dashboard, export PDF iscrizioni (anche con nomi in arabo) | PDF scaricato; eventuali caratteri non latini mostrati come `?` con nota |
| 9 | Cambio username dal profilo (libero / già usato) | Salvato / errore "già in uso" |
| 10 | App: su Android/Chrome desktop, seconda visita al sito | Compare l'invito "Installa l'app"; installata si apre a schermo intero. Su iPhone: istruzioni per "Aggiungi alla schermata Home" |
| 11 | App: modalità aereo dopo aver visitato alcune pagine | Pagine già viste consultabili; le altre mostrano "Sei offline" |
| 12 | Avvisi: crea un avviso urgente dal pannello | Striscia rossa in cima alle pagine e bacheca in home (entro circa un minuto per la cache) |
| 13 | Notifiche (se VAPID configurate): "Attiva notifiche" su `/avvisi` dal telefono, poi pulsante campanella sull'avviso nel pannello | Notifica ricevuta; tocco → pagina Avvisi |
| 14 | Iscrizione a un evento con la tua email | Email di conferma ricevuta |
| 15 | Registrazione nuovo account | Email "Conferma il tuo indirizzo"; dopo il clic il profilo mostra "Email confermata" |
| 16 | Vercel → Settings → Cron Jobs → Run sull'evento di domani (facoltativo) | Promemoria ricevuto dagli iscritti con email |
| 17 | Vercel → Logs (Runtime) | Nessuna delle righe della tabella seguente |

Righe di log che indicano un problema di configurazione:

| Log | Causa |
|---|---|
| `Variabile d'ambiente MONGODB_URI mancante` | `MONGODB_URI` non impostata |
| `[MongoDB] Connection promise failed` ripetuto | Credenziali o Network Access Atlas |
| `ADMIN_SESSION_SECRET non è impostata` | Variabile mancante |
| `Variabili d'ambiente Supabase server mancanti` | `NEXT_PUBLIC_SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY` |
| `[oauth] … disabilitato: NEXT_PUBLIC_SITE_URL mancante` | `NEXT_PUBLIC_SITE_URL` assente al build |
| `[forgot-password] NEXT_PUBLIC_SITE_URL mancante` | Idem, per il reset password |
| `[email] reset-password send skipped: RESEND_API_KEY not configured` | Resend non configurato |
| `[email] reset-password send skipped: EMAIL_FROM_AUTH not configured` | Mittente mancante in produzione |
| `[email] reset-password send failed` | Chiave Resend errata o dominio non verificato |
| `[redis] … non configurate` | Redis assente (funziona, ma protezioni per singola istanza) |
| `[email] booking-confirmation send skipped` / `event-reminder …` / `verify-email …` | Nessun provider email o mittente configurato |
| `[cron] event-reminders: CRON_SECRET non configurata` | Promemoria disattivati |
| `[push] invio fallito` frequente | Chiavi VAPID errate o servizio push non raggiungibile |
| `[users] indice username case-insensitive non creato` | Username storici duplicati per maiuscole: rinominarne uno |
| Errore OAuth `redirect_uri_mismatch` (Google) / "URL bloccato" (Facebook) | Callback non registrata o dominio diverso da `NEXT_PUBLIC_SITE_URL` |

---

## 6. Come tornare indietro

- **Codice**: Vercel → Deployments → deploy precedente funzionante →
  **Instant Rollback** (o "Promote to Production"). Non richiede rebuild.
- **Variabili d'ambiente**: ripristina il valore precedente e fai Redeploy.
  Cambiare `ADMIN_SESSION_SECRET` disconnette tutti gli utenti.
- **Database**: questa versione non esegue migrazioni distruttive. L'unica
  modifica automatica è l'indice aggiuntivo `username_ci_unique` su `users`
  (rimovibile con `db.users.dropIndex("username_ci_unique")`, non necessario
  per il rollback). RLS su Supabase è reversibile con `DISABLE ROW LEVEL
  SECURITY`, ma non serve disattivarlo: il codice precedente usa anch'esso la
  service role.
- **OAuth/Resend**: le configurazioni sui portali sono additive (nuove
  callback/domini) e non interferiscono con un rollback.

---

## 7. Limiti noti al momento del deploy

- Con MongoDB irraggiungibile, `getDb()` ritenta con timeout lunghi
  (vedi `MONGODB_COLD_START_FIX.md`): in locale una richiesta ha impiegato
  ~110 s prima dell'errore, oltre i 60 s di `maxDuration`, quindi su Vercel
  diventa un timeout 504. Con Atlas raggiungibile non si presenta; se accade,
  controllare credenziali/Network Access prima di toccare i timeout.
- Export PDF iscrizioni: i font standard non supportano arabo/copto; quei
  caratteri appaiono come `?` (nota nel PDF). Il supporto completo richiede
  un font Unicode con shaping arabo.
- Senza Redis, rate limit e revoca sessioni admin non sono condivisi tra
  istanze serverless.
- `arctic` (libreria OAuth) e le dipendenze `@oslojs/*` risultano deprecate
  su npm: funzionano, ma vanno sostituite in un intervento dedicato.
- La mappa Google Maps in `/contatti` può impostare cookie di terze parti
  senza consenso preventivo.
