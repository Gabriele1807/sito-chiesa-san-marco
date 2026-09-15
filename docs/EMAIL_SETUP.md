# Configurazione servizio email (Resend + Brevo)

Guida per attivare l'invio email in locale e su Vercel. Riguarda solo le **credenziali e il dominio**: il codice è già implementato (`src/lib/email/`, `src/app/api/auth/forgot-password`, `src/app/api/auth/reset-password`).

Due provider, un compito ciascuno:

- **Resend** → email di autenticazione/sicurezza. Oggi l'unico flusso realmente attivo è il reset password.
- **Brevo** → email eventi/comunicazioni (conferma iscrizione, promemoria, newsletter). Il modulo è predisposto (`src/lib/email/brevo.ts` e i template in `src/lib/email/templates/`) ma **non è ancora collegato** a nessun flusso reale di prenotazione/evento — configuralo solo se stai lavorando su quella parte.

Variabili coinvolte:

```env
RESEND_API_KEY=
EMAIL_FROM_AUTH=
EMAIL_REPLY_TO=
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60

BREVO_API_KEY=
EMAIL_FROM_EVENTS=
EMAIL_FROM_NEWSLETTER=
```

`NEXT_PUBLIC_SITE_URL` (probabilmente già impostata) è riusata come base per i link nelle email (es. il link di reset password) — deve essere l'URL pubblico esatto del sito, senza slash finale.

---

## 1. Resend (email di autenticazione)

1. Vai su [resend.com](https://resend.com) e crea un account (piano gratuito sufficiente per lo sviluppo e per basso volume in produzione).
2. Nella dashboard, **API Keys → Create API Key**:
   - Permessi: `Sending access` è sufficiente.
   - Copia la chiave generata (mostrata una sola volta) → variabile `RESEND_API_KEY`.
3. Mittente:
   - In sviluppo puoi usare l'indirizzo di test già verificato da Resend, `onboarding@resend.dev` (nessuna configurazione DNS necessaria, ma invia solo alla tua email di account Resend).
   - In produzione va verificato un dominio reale (vedi §3 più sotto) e `EMAIL_FROM_AUTH` va impostato su un indirizzo di quel dominio (es. `noreply@auth.tuodominio.it`), **mai** un indirizzo Gmail personale.
4. `EMAIL_REPLY_TO` (opzionale): un indirizzo realmente monitorato se vuoi che le risposte alle email arrivino da qualche parte; lascialo vuoto altrimenti.

---

## 2. Brevo (email eventi/comunicazioni)

Necessario solo se stai lavorando sui flussi di prenotazione/evento/newsletter — non serve per il reset password.

1. Vai su [brevo.com](https://www.brevo.com) e crea un account (piano gratuito con tetto giornaliero di invii, sufficiente per lo sviluppo).
2. Nella dashboard, **SMTP & API → API Keys → Generate a new API key** → variabile `BREVO_API_KEY`.
3. Mittente: verifica un dominio (vedi §3) e imposta `EMAIL_FROM_EVENTS` (es. `eventi@tuodominio.it`) ed `EMAIL_FROM_NEWSLETTER` (es. `newsletter@tuodominio.it`).

---

## 3. Dominio mittente e DNS (produzione)

Prima di andare in produzione con un dominio proprio:

1. Verifica il dominio (o un sottodominio dedicato, es. `auth.tuodominio.it`) **sia su Resend che su Brevo** — ogni provider ha una propria pagina "Domains" nella dashboard che genera i record da aggiungere.
2. **SPF**: aggiorna il record TXT del dominio per includere gli host di invio di entrambi i provider (il valore esatto è mostrato nel pannello DNS di ciascun provider dopo aver aggiunto il dominio).
3. **DKIM**: aggiungi i record CNAME/TXT forniti da ciascun provider per firmare le email in uscita.
4. **DMARC**: aggiungi un record `_dmarc` con una policy (parti da `p=none` per monitorare, poi passa a `p=quarantine`/`p=reject` una volta verificato che la posta legittima passi i controlli).
5. Attendi la propagazione DNS e usa lo strumento di verifica di ciascun provider (Resend/Brevo mostrano lo stato "Verified" quando i record sono a posto — può richiedere da qualche minuto a qualche ora).
6. Imposta `EMAIL_FROM_AUTH`/`EMAIL_FROM_EVENTS`/`EMAIL_FROM_NEWSLETTER` su indirizzi del dominio verificato, non su un indirizzo Gmail personale: un mittente Gmail personale in produzione non supera i controlli SPF/DKIM allineati al dominio del sito e mina la deliverability (finisce in spam).

---

## 4. Configurazione in locale

Nel file `.env.local` nella root del progetto (crealo se non esiste — **non va mai committato**, è già in `.gitignore`), aggiungi/aggiorna:

```env
RESEND_API_KEY=re_la-tua-chiave
EMAIL_FROM_AUTH=onboarding@resend.dev
EMAIL_REPLY_TO=
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES=60

BREVO_API_KEY=la-tua-chiave-brevo
EMAIL_FROM_EVENTS=
EMAIL_FROM_NEWSLETTER=
```

Poi riavvia `npm run dev`. Se `RESEND_API_KEY` manca, il flusso "password dimenticata" **funziona comunque**: l'API restituisce sempre la stessa risposta generica al client, ma l'invio viene saltato e loggato come `provider_not_configured` invece di lanciare un errore — utile per sviluppare senza inviare email reali. Stesso discorso per `BREVO_API_KEY` quando (e se) verrà collegato a un flusso reale.

---

## 5. Configurazione su Vercel

1. Vai sul progetto su [Vercel Dashboard](https://vercel.com/) → **Settings → Environment Variables**.
2. Aggiungi ciascuna variabile (`RESEND_API_KEY`, `EMAIL_FROM_AUTH`, `EMAIL_REPLY_TO`, `PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES`, e se necessario `BREVO_API_KEY`, `EMAIL_FROM_EVENTS`, `EMAIL_FROM_NEWSLETTER`) con il valore reale.
3. Seleziona gli ambienti a cui applicarle:
   - **Production**: obbligatorio, con il dominio mittente verificato.
   - **Preview**: opzionale — puoi lasciarle vuote sui preview deploy se non vuoi che inviino email reali dai deploy di anteprima (si applica lo stesso fallback `provider_not_configured` descritto sopra).
4. Verifica che `NEXT_PUBLIC_SITE_URL` sia impostata correttamente per Production con il dominio reale: è la base usata per costruire il link di reset password nell'email.
5. Dopo aver salvato le variabili, fai un nuovo deploy (le env var non si applicano retroattivamente a deploy già buildati): `git push` oppure "Redeploy" dalla dashboard Vercel.

---

## 6. Verifica rapida

Dopo la configurazione (locale o produzione):

1. Vai sulla pagina di login, clicca "Password dimenticata?" → `/forgot-password`.
2. Inserisci l'email di un account di test esistente → dovresti vedere il messaggio generico di conferma e, se `RESEND_API_KEY` è configurata, ricevere l'email entro pochi secondi.
3. Clicca il link nell'email (o copia l'URL) → `/reset-password?token=...` deve mostrare il modulo per la nuova password, non un errore.
4. Imposta una nuova password → dovresti essere reindirizzato al login e riuscire ad accedere con la nuova password.
5. Prova a riusare lo stesso link email una seconda volta → deve mostrare "Link non valido o scaduto" (il token è monouso).

Se qualcosa non funziona in produzione, controlla prima lo stato "Verified" del dominio nella dashboard Resend/Brevo — la causa più comune è DNS non ancora propagato o un record SPF/DKIM mancante (vedi §3). I log del server riportano categoria/provider/esito per ogni invio (mai token, password o contenuto dell'email) — vedi `PROJECT_CONTEXT.md` §7.5.
