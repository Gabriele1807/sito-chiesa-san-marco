# Design: Audit sicurezza, UX e grafica — Chiesa di San Marco

Data: 2026-09-12
Branch previsto: `fix/security-ux-graphics-audit`

## 1. Contesto e problema

Il pannello admin (`src/app/admin/(dashboard)/**`) e le relative API
(`src/app/api/admin/**`) sono in produzione su Vercel. Un audit preliminare
(verificato file per file nel codice reale) ha confermato:

- 7 route admin (`eventi`, `icone`, `libreria`, `libreria-privata`,
  `orari`, `preghiere`, `video-corsi`) espongono GET/POST/PUT/DELETE senza
  alcun controllo di sessione admin.
- Le route `section-visibility/route.ts` e
  `section-visibility/[sectionId]/route.ts` reimplementano localmente la
  logica di controllo sessione (`requireAdminUser()`), duplicando
  `requireAdminSession`/`getAdminSession` di `src/lib/auth/session.ts`.
- `src/lib/auth/jwt.ts` firma/verifica i JWT admin con un fallback a
  cascata: `ADMIN_SESSION_SECRET` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (pubblica) → stringa hardcoded `"san-marco-dev-jwt-secret"`.
- `src/app/admin/(dashboard)/layout.tsx` non esegue alcun controllo
  sessione lato server: è puramente presentazionale (sidebar, topbar,
  toast).
- Gli `alert()` nativi sono usati in `gestione-admin/page.tsx` (12
  occorrenze) e `utenti/page.tsx` (4), mentre altrove l'app usa
  `AdminToast`/`showToast()`.
- L'admin usa classi Tailwind hardcoded (`bg-gray-50`, `text-gray-900`,
  `border-gray-200`, mix `gold`/`amber-*`), mentre il sito pubblico usa
  token semantici definiti in `globals.css`
  (`--color-background`, `--color-foreground`, `--color-surface`,
  `--color-surface-alt`, `--color-surface-2`, `--color-border`).
- CSP in `next.config.js` include `'unsafe-inline'` e `'unsafe-eval'` in
  `script-src`.

Decisioni utente raccolte prima del design:
- `ADMIN_SESSION_SECRET` è confermata impostata su Vercel Production
  → si può rimuovere il fallback senza bloccare il login in produzione.
- Non è escluso che in passato il fallback sull'anon key pubblica sia
  scattato (secret possibilmente mancante in qualche momento) → va
  trattato come potenzialmente compromesso. Poiché il JWT è verificato
  solo per firma HMAC, rimuovere il fallback invalida automaticamente,
  al primo deploy del fix, qualunque token firmato in precedenza con la
  chiave sbagliata (la verifica con la secret reale fallirà). Non serve
  quindi una rotazione manuale né un meccanismo di invalidazione
  aggiuntivo: è un effetto collaterale corretto e sufficiente del fix.

## 2. Obiettivo

Chiudere le vulnerabilità di autenticazione admin, individuare problemi
analoghi non ancora noti, uniformare il feedback UX nel pannello admin,
applicare rifiniture grafiche non drastiche (admin + pubblico, incluso
`ar`/RTL), e aggiornare `PROJECT_CONTEXT.md` a fotografia fedele dello
stato finale. Nessun redesign, nessuna funzionalità nuova fuori scopo.

## 3. Approccio

### 3.1 Sicurezza — autenticazione admin (bloccante, priorità massima)

- Proteggere le 7 route scoperte aggiungendo, a inizio di ogni handler
  GET/POST/PUT/PATCH/DELETE, una chiamata a `requireAdminSession()` (o
  `requireSuperAdminSession()` dove la scrittura originale lo richiede —
  da verificare caso per caso leggendo cosa già fa ogni route protetta
  analoga) con risposta `401` se assente.
- Rifattorizzare `section-visibility/route.ts` e
  `section-visibility/[sectionId]/route.ts` per rimuovere l'helper
  locale duplicato e riusare `requireAdminSession` da `session.ts`
  (comportamento equivalente: entrambi accettano ruolo `admin` o
  `superadmin`).
- Aggiungere un guard server-side in
  `src/app/admin/(dashboard)/layout.tsx`: diventa async, chiama
  `getAdminSession()`, e se assente/`attivo === false` esegue
  `redirect("/admin/login")` (da `next/navigation`) prima di renderizzare
  sidebar/contenuto.
- `src/lib/auth/jwt.ts`: `getJwtSecret()` lancia un errore esplicito se
  `ADMIN_SESSION_SECRET` non è definita, invece di ripiegare su
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` o sulla stringa hardcoded.
- Rate-limit e revoca token in-memory (`rate-limit.ts`,
  `revokedAdminTokens` in `session.ts`): nessuna reingegnerizzazione
  verso storage esterno (fuori scopo). Si documenta il limite noto
  (non persiste tra istanze serverless Vercel) sia con un commento nel
  codice sia in `PROJECT_CONTEXT.md`.
- CSP (`next.config.js`): si verifica manualmente in browser se
  `'unsafe-inline'`/`'unsafe-eval'` in `script-src` sono ancora
  necessari (es. per Next.js inline scripts, script YouTube/analytics).
  Si stringe solo ciò che si può rimuovere senza rompere funzionalità
  verificate a occhio nel browser; altrimenti si lascia con nota
  motivata.

Dopo le correzioni: skill `security-review` sul diff come secondo
controllo indipendente.

### 3.2 Audit problemi analoghi (Fase 2)

Ricerca sistematica (Grep su tutto `src/app/api/**`, non a campione) di:
- autorizzazione mancante o IDOR su API pubbliche;
- validazione input assente/debole;
- endpoint upload/file con permessi troppo larghi;
- secret/credenziali hardcoded;
- altri punti con logica auth duplicata invece di riusare
  `session.ts`/`mongo/sessions.ts`.

Solo problemi verificati nel codice vengono corretti; sospetti non
confermati vengono riportati come tali, non "risolti" alla cieca.

### 3.3 UX pannello admin (Fase 3)

- Sostituire tutti gli `alert()` in `gestione-admin/page.tsx` e
  `utenti/page.tsx` con `showToast()` da `AdminToast`, mantenendo lo
  stesso testo/significato dei messaggi.
- Nelle pagine admin con fetch client-side verso `/api/admin/*`,
  gestire la risposta `401` reindirizzando a `/admin/login` invece di
  mostrare tabelle vuote o errori silenziosi (pattern da applicare dove
  manca, riusando un helper condiviso se già ne esiste uno, altrimenti
  crearne uno minimo).
- Verificare che le sezioni pubbliche con contenuti vuoti mostrino uno
  stato vuoto curato e coerente (già in parte implementato secondo
  `PROJECT_CONTEXT.md` §10.2-10.3 — si verifica che sia davvero così
  ovunque).

### 3.4 Grafica (Fase 4, rifinitura non redesign)

- Admin: sostituire le classi Tailwind hardcoded (`bg-gray-50`,
  `text-gray-900`, `border-gray-200`, mix `gold`/`amber-*`) con i token
  semantici già definiti in `globals.css`
  (`bg-surface`, `bg-surface-2`, `text-foreground`, `border-border`,
  `bg-background`), per coerenza col brand pubblico e per abilitare un
  eventuale dark mode futuro. Nessun cambio di layout/struttura.
- Pubblico: solo rifiniture leggere dove la diagnosi di
  `ui-ux-pro-max` (ed eventualmente `21st-ui-review`) individua
  incoerenze reali — ogni modifica motivabile in una frase, reversibile,
  senza toccare struttura/palette/layout/identità visiva.
- Verifica esplicita in `ar` (RTL) di ogni intervento grafico e dei tre
  font brand (`Source_Sans_3`, `Cormorant_Garamond`, `Noto_Naskh_Arabic`).

## 4. Verifica e chiusura

- Test manuali in browser (skill `run`): login/logout admin, accesso
  diretto a pagina admin senza sessione → redirect login, CRUD su
  sezione prima scoperta (es. eventi), sito pubblico IT/AR, CSP/immagini/
  iframe YouTube-Drive.
- `npm run lint` e `npm run build` puliti.
- `superpowers:verification-before-completion` prima di dichiarare
  qualunque cosa risolta.
- `code-review` (effort high) sul diff completo, poi
  `superpowers:receiving-code-review` per valutare criticamente eventuali
  osservazioni.
- Aggiornamento dettagliato di `PROJECT_CONTEXT.md`: stato reale
  post-fix di sicurezza/auth (route protette, guard nel layout, limiti
  noti rimasti come rate-limit/revoca in-memory, nota sull'invalidazione
  automatica di eventuali token compromessi), nuove convenzioni grafiche
  admin, più ogni altra sezione resa non accurata dai cambi. Nessuna
  rimozione di informazioni ancora valide.
- `superpowers:finishing-a-development-branch` per decidere merge diretto
  vs PR.

## 5. Vincoli (invariati dalla richiesta originale)

- Nessuna funzionalità o refactoring fuori scopo.
- Nessun redesign grafico.
- Non rimuovere il blocco commentato della card iscrizione evento in
  `src/app/(main)/page.tsx` né altro codice commentato intenzionale.
- Ogni fix di sicurezza verificato manualmente in browser prima di
  essere considerato completo.
- Nessuna rotazione manuale della secret in produzione (non necessaria:
  vedi §1 — invalidazione automatica via rimozione fallback).
