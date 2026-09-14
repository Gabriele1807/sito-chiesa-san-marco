# Design: Login/Registrazione tramite Google e Facebook (Apple riservato)

Data: 2026-09-14
Stato: approvato per implementazione

## Obiettivo

Aggiungere registrazione/login tramite Google e Facebook al sistema di
autenticazione utenti normali esistente (JWT + MongoDB, cookie
`user_session`), mantenendo obbligatorio il mini quiz (ruolo + fascia
d'età) per le nuove registrazioni via provider, e permettendo il
collegamento/scollegamento di provider a un account già esistente.
Apple è previsto nell'architettura ma non implementato in questa fase
(richiede Apple Developer Program a pagamento — vedi §8).

Non si crea un secondo sistema di autenticazione: si riusa
`src/lib/auth/jwt.ts` (HMAC, `ADMIN_SESSION_SECRET`), il cookie
`user_session`, `src/lib/mongo/sessions.ts` e la collezione `users`.

## 1. Libreria

`arctic` (npm) per costruire URL di autorizzazione, PKCE, state e
scambio code→token per Google e Facebook. Nessun framework auth
aggiuntivo (no NextAuth/Clerk). Tutta la logica di sessione/cookie
resta nel codice esistente del progetto.

## 2. Modello dati

### 2.1 Nuova collezione `oauth_identities`

```ts
{
  _id: ObjectId,
  provider: "google" | "facebook",
  providerAccountId: string,       // id univoco lato provider
  userId: ObjectId,                // ref users._id
  providerEmail?: string,
  providerEmailVerified?: boolean,
  linkedAt: string,                // ISO date
  lastLoginAt?: string,            // ISO date
}
```

Indici:
- unico su `(provider, providerAccountId)` — un'identità esterna può
  essere collegata a un solo account locale.
- su `userId` — per elencare i provider collegati a un utente.

### 2.2 Nuova collezione `pending_oauth_registrations`

```ts
{
  _id: ObjectId,
  provider: "google" | "facebook",
  providerAccountId: string,
  providerEmail?: string,
  providerEmailVerified?: boolean,
  nome?: string,
  cognome?: string,
  pictureUrl?: string,
  createdAt: string,
  expiresAt: Date,                 // TTL 24h
}
```

Indice TTL su `expiresAt` (pulizia automatica di registrazioni
abbandonate). L'utente che sta completando la registrazione è
riconosciuto tramite un cookie `oauth_pending` (JWT firmato,
`sessionType: "oauth_pending"`, `sub` = `_id` del pending, scadenza 30
minuti) — mai tramite dati passati dal client.

### 2.3 Estensione `users` (retrocompatibile)

Nuovo campo opzionale: `hasPassword?: boolean`.
- Assente → trattato come `true` (nessuna migrazione obbligatoria per
  gli utenti esistenti; uno script di backfill idempotente viene comunque
  fornito per esplicitare il campo, vedi §7).
- Account creati solo via provider: `hasPassword: false`,
  `passwordHash` = hash bcrypt di un token casuale (mai producibile da
  una password reale, così il login con password fallisce
  correttamente senza rami di codice speciali in `tryUserLogin`).

`CreateUserData`/`createUser()` in `src/lib/mongo/users.ts` vengono
estesi con parametri opzionali `hasPassword` (default `true`) e password
generata internamente quando assente — nessuna rottura per i chiamanti
esistenti (registrazione classica).

## 3. Route API

Pattern generico per provider (`[provider]` in `"google" | "facebook"`,
validato con whitelist esplicita — mai passato a fetch/URL senza
controllo):

- `GET /api/auth/oauth/[provider]/start?intent=login|register|link&returnTo=<path>`
- `GET /api/auth/oauth/[provider]/callback`
- `POST /api/auth/oauth/complete-registration`
- `GET /api/auth/oauth/pending`
- `POST /api/auth/oauth/unlink`
- `GET /api/auth/oauth/status`

### 3.1 `start`

1. Rate limit per IP (riuso `src/lib/auth/rate-limit.ts`).
2. Se `intent=link`: richiede `user_session` valido (401 altrimenti).
3. Genera `state` random (32 byte) e, per Google, `code_verifier`
   (PKCE). Salva in cookie httpOnly/secure/`sameSite=lax`,
   `oauth_flow`, JWT firmato con: `state`, `provider`, `intent`,
   `returnTo`, `codeVerifier?`, e — solo se `intent=link` — un hash
   della sessione utente corrente (per rilegare il callback alla
   stessa sessione). Scadenza 10 minuti.
4. Redirect all'URL di autorizzazione del provider (scope minimi:
   `openid email profile` per Google, `email public_profile` per
   Facebook).

### 3.2 `callback`

1. Legge e cancella il cookie `oauth_flow`; se assente/scaduto/`state`
   non combacia col parametro di query → redirect a pagina di errore
   con messaggio "sessione OAuth scaduta, riprova" (mai fidarsi del
   solo `state` restituito dal provider senza il cookie).
2. Scambia il `code` per i token (server-side, mai esposti al client).
3. Recupera il profilo verificato: Google via ID token OIDC
   (verifica `iss`/`aud`/`nonce` se usato, oppure userinfo endpoint);
   Facebook via Graph API `/me?fields=id,name,email` con l'access
   token appena ottenuto (mai quello ricevuto da un client).
4. Cerca `oauth_identities` per `(provider, providerAccountId)`.
   - **Trovata** e `intent` non è `link`: è un login. Verifica utente
     attivo, `updateUserLastAccess`, `createUserSession`, set cookie
     `user_session`, redirect a `returnTo` (default home). Nessun
     quiz, nessuna modifica a profilo/ruolo/quiz esistenti.
   - **Trovata** ma appartiene a un altro utente rispetto alla
     sessione corrente con `intent=link`: 409, messaggio "Questo
     account Google/Facebook è già collegato a un altro profilo."
   - **Non trovata**, `intent=link`: crea `oauth_identities` collegata
     a `userId` della sessione corrente (validata dal cookie
     `oauth_flow`, non dal client). Redirect a `/profilo?linked=<provider>`.
     Nessuna creazione di utente, nessuna modifica a dati esistenti.
   - **Non trovata**, `intent=login|register`: crea
     `pending_oauth_registrations` coi dati del profilo, set cookie
     `oauth_pending`, redirect a `/?completeRegistration=1`.

### 3.3 `pending`

`GET`, richiede cookie `oauth_pending` valido; ritorna solo dati non
sensibili (`nome`, `cognome`, `providerEmail`, `provider`, se l'email è
presente/verificata) per pre-compilare lo step quiz. 401 se il cookie
manca/è scaduto: il frontend mostra un messaggio "sessione scaduta,
ricomincia con Google/Facebook".

### 3.4 `complete-registration`

1. Richiede cookie `oauth_pending` valido (401 altrimenti — **mai**
   accetta `provider`/`providerAccountId` dal body).
2. Valida `role`/`ageGroup` (stesse regole di
   `src/app/api/auth/register/route.ts`), più `email` se il provider
   non l'aveva fornita.
3. Se l'email (fornita dal provider o dall'utente) è già in uso da un
   account esistente → 409 "Email già registrata, accedi con
   email/password e collega Google/Facebook dal profilo." Nessun
   merge automatico.
4. Crea l'utente (`hasPassword: false`), crea `oauth_identities`,
   cancella il pending, crea `user_session`, redirect come una
   registrazione classica riuscita.

### 3.5 `unlink`

1. Richiede `user_session` valido.
2. Calcola metodi disponibili = (`hasPassword` ? 1 : 0) + numero
   identità in `oauth_identities` per l'utente.
3. Se il totale dopo la rimozione sarebbe 0 → 400 con messaggio
   chiaro, nessuna cancellazione.
4. Altrimenti cancella il documento `oauth_identities` corrispondente.

### 3.6 `status`

`GET`, richiede `user_session`; ritorna `{ hasPassword, identities:
[{ provider, linkedAt, providerEmail? }] }` per la sezione profilo.

## 4. UI

- `LoginModal` e `RegisterModal`: bottoni "Continua con Google" /
  "Continua con Facebook" (icona provider + testo, stato di
  caricamento, divider "oppure" rispetto al form classico).
- `RegisterModal`: nuova modalità "oauth" — quando la pagina rileva
  `?completeRegistration=1` (o il cookie `oauth_pending` via
  `/api/auth/oauth/pending`), il modale si apre direttamente sullo
  step quiz esistente, con banner "Continua come {nome}, via
  {provider}"; se l'email manca, mostra il campo email prima del
  quiz; submit chiama `complete-registration` invece di
  `/api/auth/register`.
- `/profilo`: nuova sezione "Accessi collegati" — per Google e
  Facebook, stato collegato/non collegato, bottone collega/scollega,
  conferma prima dello scollegamento, messaggio bloccante se è
  l'unico metodo disponibile. Stile coerente coi token semantici
  esistenti (`bg-surface`, `border-border`, `.eyebrow`,
  `font-display`), nessun colore hardcoded nuovo.
- Stati da gestire esplicitamente: caricamento, successo, errore,
  provider collegato, provider non collegato, identità già associata
  a un altro account, operazione annullata dall'utente (provider
  redirige a `returnTo` con `?oauthError=access_denied` gestito con
  messaggio non bloccante), impossibilità di scollegare l'unico
  metodo.

## 5. Sicurezza

- `state` random single-use, verificato solo contro il cookie
  `oauth_flow` (mai contro un valore lato client).
- PKCE per Google.
- Nessun token di provider esposto al client in nessun momento.
- Tutte le verifiche di identità e di completamento quiz sono
  server-side; `complete-registration` non accetta mai l'identità
  esterna dal body della richiesta.
- Rate limiting su `start`/`callback` riusando l'infrastruttura
  esistente (Redis/Upstash con fallback in memoria).
- Nessun secret hardcoded; solo variabili d'ambiente.
- `unlink` blocca la rimozione dell'ultimo metodo di accesso.
- Nessun merge automatico di account sulla sola email.

## 6. Variabili d'ambiente

Nuove (da aggiungere a `.env.example` e a Vercel):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Riusa `NEXT_PUBLIC_SITE_URL` già esistente per costruire le callback
URL. Callback da registrare sui portali provider:

```
${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/google/callback
${NEXT_PUBLIC_SITE_URL}/api/auth/oauth/facebook/callback
```

## 7. Migrazioni

Nessuna migrazione obbligatoria (Mongo è schema-less, `hasPassword`
assente è trattato come `true`). Script di backfill idempotente
opzionale (documentato, eseguibile manualmente) che imposta
`hasPassword: true` esplicito su tutti i documenti `users` esistenti
privi del campo, per chiarezza futura — non necessario per il
funzionamento.

## 8. Apple (riservato, non implementato in questa fase)

Struttura delle route (`[provider]` include già `"apple"` nel tipo, ma
la whitelist attiva contiene solo `"google" | "facebook"` finché non
implementato) e del modello dati sono già compatibili: aggiungere
Apple in futuro significa solo aggiungere un adapter `arctic` +
whitelist, nessun refactor.

Variabili riservate per quando verrà implementato:
```
APPLE_CLIENT_ID=       # Services ID
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

## 9. Fuori scopo

- Merge manuale assistito di due account con la stessa email (oltre al
  messaggio di errore che indica il percorso corretto).
- Import automatico dell'immagine profilo del provider come avatar
  permanente (si può mostrare nello step quiz ma non si salva).
- Apple Sign In (vedi §8).
