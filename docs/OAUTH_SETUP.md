# Configurazione login Google/Facebook

Guida per attivare il login/registrazione tramite Google e Facebook, sia in locale che su Vercel. Riguarda solo le **credenziali**: il codice è già implementato (`src/lib/oauth/`, `src/app/api/auth/oauth/**`).

Variabili coinvolte:

```env
NEXT_PUBLIC_SITE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

`NEXT_PUBLIC_SITE_URL` probabilmente è già impostata (serve anche ad altre parti del sito). Deve essere l'URL pubblico esatto del sito, senza slash finale (es. `https://www.chiesasanmarco.it` oppure, in locale, `http://localhost:3000`).

Le callback URL da registrare sui portali dei provider sono sempre:

```
${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/google/callback
${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/facebook/callback
```

Quindi in locale: `http://localhost:3000/api/auth/oauth/google/callback` (e `.../facebook/callback`), e in produzione con il dominio reale.

---

## 1. Google

1. Vai su [Google Cloud Console](https://console.cloud.google.com/) e crea un progetto (o usane uno esistente).
2. Menu **APIs & Services → OAuth consent screen**:
   - Tipo utente: **External**.
   - Compila nome app, email di supporto, logo (opzionale).
   - Scope: nessuno aggiuntivo necessario (bastano `email`, `profile`, `openid`, già default).
   - In development lascia lo stato **Testing** e aggiungi la tua email come "Test user" per poter accedere prima della pubblicazione; per l'uso pubblico dovrai passare a **In production** (richiede una breve verifica Google se usi scope sensibili, ma questi non lo sono).
3. Menu **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs: aggiungi **entrambe** le callback (locale e produzione), una per riga:
     ```
     http://localhost:3000/api/auth/oauth/google/callback
     https://www.chiesasanmarco.it/api/auth/oauth/google/callback
     ```
     (sostituisci con il dominio reale del sito).
   - Non serve impostare "Authorized JavaScript origins" per questo flusso.
4. Alla creazione, Google mostra **Client ID** e **Client Secret**:
   - `Client ID` → variabile `GOOGLE_CLIENT_ID`
   - `Client Secret` → variabile `GOOGLE_CLIENT_SECRET`

---

## 2. Facebook

1. Vai su [Facebook for Developers](https://developers.facebook.com/apps/) e crea una nuova app.
   - Tipo app: **Consumer** (o "Altro" → poi aggiungi il prodotto Facebook Login).
2. Nell'app, aggiungi il prodotto **Facebook Login** (dalla dashboard, "Add Product").
3. In **Facebook Login → Settings**:
   - **Valid OAuth Redirect URIs**: aggiungi entrambe le callback:
     ```
     http://localhost:3000/api/auth/oauth/facebook/callback
     https://www.chiesasanmarco.it/api/auth/oauth/facebook/callback
     ```
   - **Client OAuth Login**: ON.
   - **Web OAuth Login**: ON.
4. In **Impostazioni → Di base** (Settings → Basic):
   - `ID app` → variabile `FACEBOOK_CLIENT_ID`
   - `Chiave segreta dell'app` (App Secret, va rivelata con "Show") → variabile `FACEBOOK_CLIENT_SECRET`
   - Aggiungi anche qui il/i domini del sito in "Domini app" se richiesto.
5. Mentre l'app è in modalità **Development**, il login funziona solo per te (il ruolo Amministratore) e per utenti aggiunti come "Tester" in **Ruoli app**. Per renderlo disponibile a tutti gli utenti pubblici, l'app va passata in modalità **Live** (switch in alto nella dashboard) — Facebook potrebbe richiedere un "App Review" solo se si richiedono permessi oltre a `email`/`public_profile`, che non è il caso qui.

---

## 3. Configurazione in locale

Nel file `.env.local` nella root del progetto (crealo se non esiste — **non va mai committato**, è già in `.gitignore`), aggiungi/aggiorna:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

GOOGLE_CLIENT_ID=il-tuo-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=il-tuo-client-secret

FACEBOOK_CLIENT_ID=il-tuo-app-id-facebook
FACEBOOK_CLIENT_SECRET=il-tuo-app-secret-facebook
```

Poi riavvia `npm run dev`. Se una delle coppie client-id/secret manca, quel provider mostra automaticamente un errore 503 quando si prova ad accedere (non rompe il resto del sito): è il comportamento previsto quando un provider non è ancora configurato.

---

## 4. Configurazione su Vercel

1. Vai sul progetto su [Vercel Dashboard](https://vercel.com/) → **Settings → Environment Variables**.
2. Aggiungi ciascuna variabile (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`) con il valore reale.
3. Seleziona gli ambienti a cui applicarle:
   - **Production**: obbligatorio, con il dominio reale registrato nelle callback dei provider.
   - **Preview**: opzionale — se la usi, ricorda che i deploy di preview hanno URL diversi ad ogni PR, quindi la callback URL non corrisponderebbe a meno di usare un dominio fisso di preview. Se non serve testare l'OAuth sui preview, puoi lasciare le variabili solo su Production (i preview mostreranno il 503 per i provider, senza rompere il resto).
4. Verifica che `NEXT_PUBLIC_SITE_URL` sia impostata correttamente per Production con il dominio reale (deve combaciare esattamente con quanto registrato come redirect URI su Google/Facebook, protocollo incluso).
5. Dopo aver salvato le variabili, fai un nuovo deploy (le env var non si applicano retroattivamente a deploy già buildati): `git push` oppure "Redeploy" dalla dashboard Vercel.

---

## 5. Verifica rapida

Dopo la configurazione (locale o produzione):

1. Apri il sito, clicca "Continua con Google" nel modale di login/registrazione → dovresti essere reindirizzato alla schermata di consenso Google, non a un errore.
2. Stessa cosa per "Continua con Facebook".
3. Completa una registrazione di test: dopo il consenso del provider, il sito deve riportarti al mini quiz (ruolo + fascia d'età) prima di considerare la registrazione completata.
4. Da un account già loggato con email/password, vai su **Profilo → Accessi collegati** e prova a collegare un provider: deve confermare senza creare un nuovo account.

Se qualcosa non funziona, controlla prima che l'URL nella barra degli indirizzi al momento dell'errore contenga `oauthError=<codice>` — i codici principali sono documentati in `src/lib/oauth/error-messages.ts` e in `PROJECT_CONTEXT.md` §7.4.
