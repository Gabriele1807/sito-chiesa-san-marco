# Audit sicurezza, bug e problemi tecnici

Data audit: 2026-09-27

## Perimetro e livello di confidenza

Audit statico mirato del codice applicativo, delle route API, dei moduli auth/MongoDB/email, della configurazione e delle dipendenze. I finding qui sotto sono problemi verificabili nel codice o risultati riproducibili dei comandi indicati. Non sono incluse proposte architetturali dettagliate: ogni voce descrive solo cosa va analizzato e sistemato.

## Riepilogo priorita

| Priorita | Numero | Sintesi |
| --- | ---: | --- |
| Critical | 1 | Dipendenze runtime con advisory critici, incluso Next.js |
| High | 4 | Sessioni admin stale, isolamento iscrizioni, logout JWT, CRUD admin non validati |
| Medium | 7 | Rate limit, paginazione, ID concorrenti, privacy file, password recovery, email stub, policy password |
| Low | 3 | Lint/build hygiene e copertura di test insufficiente |

## Critical

### C-01 - Dipendenze runtime vulnerabili, incluso Next.js

- **Evidenza:** `npm audit --omit=dev --audit-level=moderate` segnala 9 vulnerabilita: 1 critical, 5 high, 2 moderate e 1 low.
- **Pacchetti principali:** `next@16.1.6` rientra nell'intervallo vulnerabile riportato da npm audit; sono inoltre coinvolti `next-intl`, `postcss`, `sharp`, `ws`, `nanoid`, `picomatch`, `baseline-browser-mapping` e `icu-minify` tramite dipendenze dirette o transitive.
- **Impatto:** possibile request smuggling, bypass di proxy/middleware, cache poisoning, SSRF/DoS, disclosure o altri impatti dipendenti dall'advisory e dalla superficie effettivamente usata.
- **Da sistemare:** verificare ogni advisory rispetto all'uso reale del progetto, aggiornare le versioni interessate e ripetere l'audit senza lasciare vulnerabilita runtime note non valutate.
- **Nota:** `npm audit fix --force` propone un aggiornamento di Next.js fuori dall'intervallo dichiarato; l'aggiornamento va quindi verificato con build e test.

## High

### H-01 - Sessioni admin valide dopo disattivazione o cambio ruolo

- **Riferimenti:** `src/lib/auth/session.ts:109-140`, `src/app/api/admin/users/[id]/toggle/route.ts`, `src/app/api/admin/users/[id]/route.ts`.
- **Evidenza:** `validateSession()` verifica firma, scadenza, `sessionType`, `sub`, username e ruolo presenti nel JWT, ma non rilegge lo stato corrente di `admin_users` e non verifica `attivo`.
- **Impatto:** un token gia emesso continua a rappresentare l'admin fino alla scadenza anche dopo disattivazione, eliminazione o downgrade; un superadmin puo conservare privilegi revocati.
- **Da sistemare:** rendere effettiva la revoca/disattivazione/downgrade delle sessioni gia emesse e coprire il comportamento con test.

### H-02 - Possibile accesso a iscrizioni di altri utenti tramite regex non escapate

- **Riferimenti:** `src/lib/mongo/registrations.ts:24-29, 155-205`, `src/app/api/auth/update-profile/route.ts:280-286`, `src/app/api/auth/iscrizioni/route.ts:15-52`.
- **Evidenza:** `normalizeName()` esegue trim, lowercase e normalizzazione degli spazi, ma non fa escaping regex. `getIscrizioniByUser()` inserisce nome e cognome dentro regex MongoDB (`^${nomeNorm}$`, `^${cognomeNorm}$`); l'utente puo modificare i propri nomi tramite il profilo.
- **Impatto:** valori come `.*` possono allargare la query oltre l'identita dell'utente e restituire iscrizioni contenenti dati personali di altre persone/famiglie.
- **Da sistemare:** verificare e correggere il controllo di ownership senza basarsi su campi profilo modificabili e impedire che input utente diventi espressione regex.

### H-03 - Logout utente senza revoca del bearer token

- **Riferimenti:** `src/app/api/auth/logout/route.ts:6-22`, `src/lib/mongo/sessions.ts:91-104`.
- **Evidenza:** `deleteUserSession()` e una funzione vuota; il codice documenta che il JWT rimane valido fino alla scadenza naturale.
- **Impatto:** chi possiede una copia del JWT puo riutilizzarla dopo il logout, fino a 24 ore o fino a 7 giorni con remember-me.
- **Da sistemare:** rendere coerente il logout con il modello di sessione e definire una revoca verificabile per i token rubati.

### H-04 - CRUD contenuti admin senza validazione runtime e con mass assignment

- **Riferimenti:** `src/app/api/admin/eventi/route.ts:16-44`, stesso pattern nelle route admin dei contenuti, `src/lib/mongo/content.ts` nelle funzioni `add*`/`update*`.
- **Evidenza:** il body JSON viene passato direttamente a `addEvento()`/`updateEvento()` dopo un controllo di autenticazione; i tipi TypeScript non costituiscono validazione a runtime e non risulta una whitelist completa dei campi.
- **Impatto:** dati corrotti o tipi inattesi nel database, campi non previsti aggiornabili e valori URL incorporati nella UI senza una validazione centralizzata. Va verificato anche il rischio di stored XSS/unsafe URL nei singoli renderer.
- **Da sistemare:** introdurre controlli runtime coerenti per ogni endpoint, whitelist dei campi e validazione contestuale dei valori usati come URL, iframe, immagini o stile.

## Medium

### M-01 - Rate limit basato su `X-Forwarded-For` manipolabile

- **Riferimenti:** `src/app/api/auth/login/route.ts:20-21`, `src/lib/auth/rate-limit.ts:190-197`.
- **Evidenza:** viene usato il primo valore di `x-forwarded-for` senza una verifica della catena di proxy fidati; lo stesso helper e usato da registrazione, OAuth, iscrizioni ed endpoint pubblici.
- **Impatto:** se il proxy/deployment lascia passare il valore fornito dal client, un attaccante puo cambiare IP a ogni richiesta e aggirare il rate limit, facilitando brute force o spam.
- **Da sistemare:** definire la sorgente IP attendibile per il deployment e impedire che header client arbitrari determinino l'identita del rate limit.

### M-02 - Paginazione admin senza validazione o limite massimo

- **Riferimenti:** `src/app/api/admin/utenti/route.ts:22-23`, `src/lib/mongo/users.ts:184-186`.
- **Evidenza:** `page` e `limit` arrivano dalla query string con `parseInt()` e vengono passati a `listUsers()` senza clamp, controllo di finitezza o limite massimo.
- **Impatto:** un superadmin autenticato puo provocare query, serializzazione e consumo memoria sproporzionati con valori enormi, negativi o non numerici.
- **Da sistemare:** validare i parametri e definire limiti server-side anche per valori non numerici e pagine fuori range.

### M-03 - Race condition nella generazione degli ID numerici

- **Riferimenti:** `src/lib/mongo/content.ts:72-77` e gli indici unici creati in `ensureIndexes()`.
- **Evidenza:** `nextId()` legge tutti gli ID, calcola `max + 1` e restituisce il risultato in un'operazione separata dall'inserimento.
- **Impatto:** due richieste admin concorrenti possono ottenere lo stesso ID; l'indice unico puo causare errori intermittenti o perdita della creazione.
- **Da sistemare:** rendere atomica l'assegnazione dell'ID o usare un identificatore collision-free, includendo un test di concorrenza.

### M-04 - La libreria privata dipende dalla privacy configurata su Google Drive

- **Riferimenti:** `src/app/api/admin/libreria-privata/route.ts:7-33`, `src/lib/mongo/content.ts` nelle funzioni `getFilePrivati()`/`addFilePrivato()`.
- **Evidenza:** l'app protegge l'elenco con sessione admin ma memorizza e restituisce un URL esterno; non effettua il download tramite un controllo server-side.
- **Impatto:** se il file Drive e pubblico o condiviso con chiunque abbia il link, il contenuto dichiarato privato e accessibile senza autenticazione applicativa.
- **Da sistemare:** verificare il modello di condivisione dei file e allineare la promessa di privacy al controllo effettivo sul download.

### M-05 - Recupero password incompleto per gli account admin/Supabase

- **Riferimenti:** `src/app/api/auth/forgot-password/route.ts:44-70`, `src/lib/email/send-email.ts:71-84`.
- **Evidenza:** il flusso `forgot-password` cerca utenti MongoDB; le funzioni email per verifica, conferma iscrizione, reminder e newsletter sono stub che lanciano `not implemented`. Non risulta un percorso funzionante equivalente per gli admin Supabase.
- **Impatto:** account admin irrecuperabili tramite il normale flusso email e funzionalita dichiarate non operative.
- **Da sistemare:** definire, implementare e testare il percorso di recupero per ogni tipo di account oppure documentare esplicitamente il processo operativo alternativo.

### M-06 - Funzionalita email dichiarate ma lasciate come stub runtime

- **Riferimenti:** `src/lib/email/send-email.ts:71-90`.
- **Evidenza:** `sendVerificationEmail()`, `sendBookingConfirmationEmail()`, `sendEventReminderEmail()` e `sendNewsletter()` lanciano direttamente `Error("not implemented")`.
- **Impatto:** ogni chiamata futura o gia esistente a queste funzioni produce errore server; i flussi di verifica, comunicazione iscrizione, reminder e newsletter possono fallire senza comportamento utente completo.
- **Da sistemare:** individuare tutti i call site, decidere quali flussi sono supportati e impedire che endpoint pubblici arrivino a stub non gestiti.

### M-07 - Policy password admin incoerente

- **Riferimenti:** `src/app/api/admin/users/route.ts:69-76`, `src/app/api/admin/users/[id]/route.ts:47-55`, `src/lib/auth/password-rules.ts`.
- **Evidenza:** creazione e modifica admin controllano solo una lunghezza minima di 8 caratteri, mentre altri flussi applicano regole aggiuntive di complessita.
- **Impatto:** account admin creati o modificati possono avere una password piu debole rispetto alla policy attesa dal resto dell'applicazione.
- **Da sistemare:** uniformare la policy applicata a creazione, modifica, reset e cambio password e aggiungere test parametrizzati.

## Low

### L-01 - Lint non pulito con 31 errori

- **Evidenza:** `npm run lint` termina con exit code 1 e riporta 31 errori e 36 warning. Gli errori includono import `require()` vietati nei file di tooling, `any` espliciti in route/moduli applicativi e `setState` sincrono dentro un effect in `src/components/sidebar/SidebarContext.tsx:31`.
- **Impatto:** la pipeline non puo usare il lint come gate affidabile; alcuni errori applicativi possono nascondere problemi di manutenzione o regressioni.
- **Da sistemare:** classificare e risolvere gli errori applicativi e configurare correttamente l'ambito dei file di tooling senza silenziare indiscriminatamente il lint.

### L-02 - Test mancanti sui percorsi ad alto impatto

- **Evidenza:** la suite presente passa, ma non risultano test per revoca/downgrade di sessioni admin, isolamento iscrizioni con metacaratteri regex, spoofing degli header proxy, concorrenza di `nextId()`, limiti di paginazione e validazione degli URL dei contenuti.
- **Impatto:** i rischi piu importanti possono regredire senza essere rilevati.
- **Da sistemare:** aggiungere test di sicurezza e di concorrenza per questi casi, inclusi test di integrazione dove i mock attuali non verificano il comportamento MongoDB/Supabase reale.

### L-03 - Warning applicativi e uso di immagini non ottimizzate

- **Evidenza:** `npm run lint` riporta vari warning di variabili/import inutilizzati e uso di `<img>` in pagine/componenti pubblici.
- **Impatto:** dead code, segnali di flussi incompleti e possibili regressioni di performance/LCP; non e una vulnerabilita diretta.
- **Da sistemare:** ripulire gli elementi inutilizzati e valutare l'uso coerente del componente immagini previsto dal framework.

## Verifiche eseguite

- `npm test -- --run`: **passato**, 34 file e 173 test.
- `npm run build`: **passato** nel terminale della sessione.
- `npm run lint`: **fallito**, 31 errori e 36 warning.
- `npm audit --omit=dev --audit-level=moderate`: **fallito**, 9 vulnerabilita runtime segnalate.

## Aree controllate senza finding confermato in questo audit

- Verifica di state/PKCE e safe redirect OAuth.
- Hash e consumo atomico dei token di reset password.
- Risposte generiche del forgot-password contro l'enumerazione email.
- Controlli di autenticazione presenti nelle principali route `/api/admin/*`.

Queste verifiche non sostituiscono test di integrazione o penetration test in ambiente di staging.