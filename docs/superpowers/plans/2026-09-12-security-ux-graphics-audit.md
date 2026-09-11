# Security/UX/Graphics Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chiudere le vulnerabilità di autenticazione admin note e analoghe, uniformare UX/feedback nel pannello admin, applicare rifiniture grafiche non drastiche, e lasciare `PROJECT_CONTEXT.md` come fotografia fedele dello stato finale.

**Architecture:** Nessun cambio architetturale. Si riusa `src/lib/auth/session.ts` (`requireAdminSession`/`requireSuperAdminSession`/`getAdminSession`) come unico punto di verità per l'auth admin, si aggiunge un guard server-side nel layout dashboard, e si consolidano stili admin sui token semantici già definiti in `globals.css`. Non esiste una suite di test automatici nel progetto (nessun `test` script in `package.json`): la verifica avviene via `npm run lint`, `npm run build` (che include il type-check TypeScript) e verifica manuale in browser con la skill `run`, come richiesto esplicitamente nello spec.

**Tech Stack:** Next.js 16 App Router, TypeScript, MongoDB, Supabase (solo admin), TailwindCSS v4.

**Spec:** `docs/superpowers/specs/2026-09-12-security-ux-graphics-audit-design.md`

## Global Constraints

- Nessuna funzionalità o refactoring fuori scopo.
- Nessun redesign grafico: solo rifiniture puntuali, motivabili in una frase, reversibili.
- Non rimuovere il blocco commentato della card iscrizione evento in `src/app/(main)/page.tsx` né altro codice commentato intenzionale.
- Ogni fix di sicurezza va verificato manualmente in browser prima di essere considerato completo.
- `ADMIN_SESSION_SECRET` è confermata presente su Vercel Production — nessuna rotazione manuale necessaria.
- Non introdurre Redis o altro storage esterno per rate-limit/revoca token: fuori scopo, solo documentare il limite.
- Mantenere intatti i tre font brand e il supporto RTL per `ar`.

---

### Task 1: Rimuovere il fallback pericoloso della secret JWT

**Files:**
- Modify: `src/lib/auth/jwt.ts:18-24`

**Interfaces:**
- Consumes: `process.env.ADMIN_SESSION_SECRET`
- Produces: `getJwtSecret(): string` continua ad avere la stessa firma, usata da `importJwtKey()` nello stesso file — nessun altro file chiama `getJwtSecret` direttamente (è privata al modulo).

- [ ] **Step 1: Sostituire la funzione con fallback**

In `src/lib/auth/jwt.ts`, sostituire:

```ts
function getJwtSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "san-marco-dev-jwt-secret"
  );
}
```

con:

```ts
function getJwtSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET non è impostata: impossibile firmare o verificare sessioni admin."
    );
  }
  return secret;
}
```

- [ ] **Step 2: Verifica type-check**

Run: `npm run build`
Expected: build completa senza errori TypeScript relativi a `jwt.ts` (la funzione ha lo stesso tipo di ritorno `string`).

- [ ] **Step 3: Verifica manuale locale**

Con `.env.local` che ha già `ADMIN_SESSION_SECRET` impostata (confermato presente), avviare `npm run dev`, fare login su `/admin/login` e verificare che la sessione venga creata e la dashboard sia raggiungibile. Questo conferma che il percorso "secret presente" non è stato rotto.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/jwt.ts
git commit -m "fix: remove insecure JWT secret fallback"
```

---

### Task 2: Proteggere le 7 route admin prive di controllo sessione

**Files:**
- Modify: `src/app/api/admin/eventi/route.ts`
- Modify: `src/app/api/admin/icone/route.ts`
- Modify: `src/app/api/admin/libreria/route.ts`
- Modify: `src/app/api/admin/libreria-privata/route.ts`
- Modify: `src/app/api/admin/orari/route.ts`
- Modify: `src/app/api/admin/preghiere/route.ts`
- Modify: `src/app/api/admin/video-corsi/route.ts`

**Interfaces:**
- Consumes: `requireAdminSession(): Promise<AdminUser | null>` da `src/lib/auth/session.ts` (già esistente, usata da `src/app/api/admin/iscrizioni/route.ts` con lo stesso pattern).
- Produces: nessuna nuova interfaccia; ogni handler ritorna `401 { error: "Non autorizzato" }` quando `adminUser` è `null`.

Tutti e 7 i file condividono la stessa struttura (`GET`, `POST`, `PUT`/niente PUT per `libreria-privata`, `DELETE`). Il pattern da applicare è identico in ognuno: aggiungere l'import e, come prima riga di ogni handler esportato, il controllo sessione.

- [ ] **Step 1: `src/app/api/admin/eventi/route.ts`**

Aggiungere l'import in cima:

```ts
import { requireAdminSession } from "@/lib/auth/session";
```

Modificare ogni handler aggiungendo il controllo come prima istruzione del corpo (dentro il `try` per POST/PUT/DELETE, prima di ogni altra cosa per GET):

```ts
export async function GET() {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return NextResponse.json(await getEventi());
}

export async function POST(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const evento = await addEvento(body);
    revalidatePublicContent("eventi");
    return NextResponse.json(evento, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const updated = await updateEvento(id, data);
    if (!updated) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    revalidatePublicContent("eventi");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const adminUser = await requireAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    const deleted = await deleteEvento(id);
    if (!deleted) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    await deleteIscrizioniByEvento(id);
    revalidatePublicContent("eventi");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
}
```

- [ ] **Step 2: `src/app/api/admin/icone/route.ts`**

Stesso pattern: aggiungere `import { requireAdminSession } from "@/lib/auth/session";` e il blocco di controllo come prima riga di `GET`, `POST`, `PUT`, `DELETE` (stessa struttura del Step 1, con le funzioni `getIcone`/`addIcona`/`updateIcona`/`deleteIcona` già presenti nel file).

- [ ] **Step 3: `src/app/api/admin/libreria/route.ts`**

Stesso pattern applicato a `GET`/`POST`/`PUT`/`DELETE` con `getLibri`/`addLibro`/`updateLibro`/`deleteLibro`.

- [ ] **Step 4: `src/app/api/admin/libreria-privata/route.ts`**

Stesso pattern applicato a `GET`/`POST`/`DELETE` (questo file non ha `PUT`) con `getFilePrivati`/`addFilePrivato`/`deleteFilePrivato`. Dato che gestisce dati sensibili (file privati), verificare con particolare attenzione in Step 7 che il 401 scatti correttamente.

- [ ] **Step 5: `src/app/api/admin/orari/route.ts`**

Stesso pattern applicato a `GET`/`POST`/`PUT`/`DELETE` con `getOrari`/`addOrario`/`updateOrario`/`deleteOrario` (nota: qui la chiave è `giorno`, non `id` — non cambiare quella logica, solo aggiungere il controllo sessione).

- [ ] **Step 6: `src/app/api/admin/preghiere/route.ts`**

Stesso pattern applicato a `GET`/`POST`/`PUT`/`DELETE` con `getPreghiere`/`addPreghiera`/`updatePreghiera`/`deletePreghiera`.

- [ ] **Step 7: `src/app/api/admin/video-corsi/route.ts`**

Stesso pattern applicato a `GET`/`POST`/`PUT`/`DELETE` con `getVideoCorsi`/`addVideoCorso`/`updateVideoCorso`/`deleteVideoCorso`.

- [ ] **Step 8: Verifica type-check**

Run: `npm run build`
Expected: nessun errore TypeScript nei 7 file modificati.

- [ ] **Step 9: Verifica manuale — accesso negato senza sessione**

Con `npm run dev` attivo e nessun cookie `admin_session` (browser in incognito o dopo logout), aprire gli strumenti di sviluppo e verificare con `fetch('/api/admin/eventi').then(r=>r.status)` (o equivalente per le altre 6 route) che la risposta sia `401` per tutte e 7.

- [ ] **Step 10: Verifica manuale — CRUD funzionante con sessione**

Fare login admin, aprire la pagina eventi nel pannello admin, creare/modificare/eliminare un evento di prova e verificare che tutto funzioni come prima (nessuna regressione).

- [ ] **Step 11: Commit**

```bash
git add src/app/api/admin/eventi/route.ts src/app/api/admin/icone/route.ts src/app/api/admin/libreria/route.ts src/app/api/admin/libreria-privata/route.ts src/app/api/admin/orari/route.ts src/app/api/admin/preghiere/route.ts src/app/api/admin/video-corsi/route.ts
git commit -m "fix: require admin session on previously unprotected admin API routes"
```

---

### Task 3: Consolidare le route `section-visibility` sull'helper condiviso

**Files:**
- Modify: `src/app/api/admin/section-visibility/route.ts`
- Modify: `src/app/api/admin/section-visibility/[sectionId]/route.ts`

**Interfaces:**
- Consumes: `requireAdminSession` da `src/lib/auth/session.ts` (stessa interfaccia del Task 2).
- Produces: rimuove l'helper locale duplicato `requireAdminUser()` da entrambi i file.

- [ ] **Step 1: `src/app/api/admin/section-visibility/route.ts`**

Sostituire:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth/session";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

async function requireAdminUser() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_session")?.value;
  if (!adminToken) return null;

  const adminUser = await validateSession(adminToken);
  if (!adminUser || !adminUser.attivo) return null;
  if (adminUser.ruolo !== "admin" && adminUser.ruolo !== "superadmin") return null;

  return adminUser;
}

export async function GET() {
  try {
    const adminUser = await requireAdminUser();
```

con:

```ts
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getAllSectionVisibilities } from "@/lib/mongo/visibility";

export async function GET() {
  try {
    const adminUser = await requireAdminSession();
```

Il resto del file (corpo di `GET`, gestione errori) resta invariato: `requireAdminSession` già filtra su `attivo === true` e i ruoli `admin`/`superadmin` sono gli unici due valori possibili di `AdminUser.ruolo`, quindi il comportamento è identico.

- [ ] **Step 2: `src/app/api/admin/section-visibility/[sectionId]/route.ts`**

Stessa sostituzione: rimuovere l'import di `cookies` e `validateSession`, l'helper locale `requireAdminUser()`, aggiungere `import { requireAdminSession } from "@/lib/auth/session";`, e sostituire le due chiamate `await requireAdminUser()` (una in `GET`, una in `PUT`) con `await requireAdminSession()`. Nessun altro cambiamento: la logica di autorizzazione sui ruoli per `roleConfig` (righe 75-77, solo superadmin) resta invariata.

- [ ] **Step 3: Verifica type-check**

Run: `npm run build`
Expected: nessun errore TypeScript.

- [ ] **Step 4: Verifica manuale**

Da loggato come admin non-superadmin, aprire la pagina di gestione visibilità sezioni e verificare che il toggle `isActive` funzioni ma il tentativo di modificare `roleConfig` sia rifiutato con 403 (comportamento preesistente, solo per confermare che il refactor non l'abbia rotto). Da loggato come superadmin, verificare che entrambe le operazioni funzionino.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/section-visibility/route.ts "src/app/api/admin/section-visibility/[sectionId]/route.ts"
git commit -m "refactor: reuse requireAdminSession in section-visibility routes"
```

---

### Task 4: Guard server-side centralizzato nel layout dashboard admin

**Files:**
- Modify: `src/app/admin/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `getAdminSession(): Promise<AdminUser | null>` da `src/lib/auth/session.ts`; `redirect` da `next/navigation`.
- Produces: nessuna nuova interfaccia pubblica; il layout diventa `async`.

- [ ] **Step 1: Aggiungere il guard**

Sostituire il contenuto di `src/app/admin/(dashboard)/layout.tsx`:

```tsx
// FIX [9] — Dashboard layout with sidebar, separated from login route
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbarTitle from "@/components/admin/AdminTopbarTitle";
import AdminToast from "@/components/admin/AdminToast";
import AdminMobileMenuButton from "@/components/admin/AdminMobileMenuButton";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminSession();
  if (!adminUser) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminSidebar />

      {/* Topbar */}
      <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 z-30 gap-3">
        <AdminMobileMenuButton />
        <AdminTopbarTitle />
      </header>

      {/* Content */}
      <main className="lg:ml-[260px] pt-14">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <AdminToast />
    </>
  );
}
```

Nota: `getAdminSession()` già ritorna `null` sia se il cookie manca, sia se `adminUser.attivo === false` (vedi `session.ts:96-109`), quindi un singolo controllo copre entrambi i casi richiesti dallo spec (assente/scaduta/disattivata).

- [ ] **Step 2: Verifica type-check**

Run: `npm run build`
Expected: nessun errore (Next.js supporta layout `async` in App Router).

- [ ] **Step 3: Verifica manuale — redirect senza sessione**

In una finestra in incognito (nessun cookie), navigare direttamente a `/admin/eventi` (o altra pagina dashboard). Verificare che si venga reindirizzati a `/admin/login` senza che la shell admin (sidebar/topbar) sia mai visibile, nemmeno per un istante.

- [ ] **Step 4: Verifica manuale — accesso con sessione valida**

Login admin, navigare tra le pagine della dashboard, verificare che tutto funzioni come prima.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(dashboard)/layout.tsx"
git commit -m "fix: add server-side session guard to admin dashboard layout"
```

---

### Task 5: Documentare i limiti di rate-limit e revoca token in-memory

**Files:**
- Modify: `src/lib/auth/rate-limit.ts:1-12`
- Modify: `src/lib/auth/session.ts:9`

**Interfaces:**
- Nessun cambio di comportamento o firma — solo commenti.

- [ ] **Step 1: Espandere il commento in `rate-limit.ts`**

Il file ha già un commento "FUTURO: sostituire con Redis...". Aggiungere un paragrafo esplicito sul rischio pratico. Sostituire le righe 1-12:

```ts
/**
 * Rate limiting in memoria per tentativi di login e richieste pubbliche.
 *
 * Dopo 5 tentativi falliti dallo stesso IP in 15 minuti,
 * blocca temporaneamente ulteriori tentativi di login.
 *
 * Dopo 60 richieste dallo stesso IP in 1 minuto,
 * blocca temporaneamente ulteriori richieste generiche.
 *
 * FUTURO: sostituire con Redis o Supabase per ambienti multi-istanza
 * (es. Vercel serverless). Con Redis: usare INCR + EXPIRE per contatore IP.
 */
```

con:

```ts
/**
 * Rate limiting in memoria per tentativi di login e richieste pubbliche.
 *
 * Dopo 5 tentativi falliti dallo stesso IP in 15 minuti,
 * blocca temporaneamente ulteriori tentativi di login.
 *
 * Dopo 60 richieste dallo stesso IP in 1 minuto,
 * blocca temporaneamente ulteriori richieste generiche.
 *
 * LIMITE NOTO: gli stati (`attempts`, `requestAttempts`) vivono in memoria
 * di processo. Su Vercel (funzioni serverless), ogni istanza/regione ha la
 * propria copia della Map e le istanze vengono riciclate: il rate limit
 * reale è quindi "per istanza", non globale, e un attaccante distribuito su
 * più richieste concorrenti può superare i limiti nominali. Non è una
 * protezione robusta contro brute-force distribuito in produzione seriale.
 *
 * FUTURO: sostituire con Redis o Supabase per ambienti multi-istanza
 * (es. Vercel serverless). Con Redis: usare INCR + EXPIRE per contatore IP.
 * Fuori scopo per questo intervento: vedi PROJECT_CONTEXT.md sezione sicurezza.
 */
```

- [ ] **Step 2: Espandere il commento su `revokedAdminTokens` in `session.ts`**

Sostituire la riga:

```ts
const revokedAdminTokens = new Set<string>();
```

con:

```ts
// LIMITE NOTO: come rate-limit.ts, questo Set vive in memoria di processo.
// Su Vercel (serverless) non è condiviso tra istanze/regioni: un token
// "revocato" (es. dopo logout) può restare valido su un'istanza diversa
// finché non scade naturalmente. Fuori scopo risolverlo in questo
// intervento: vedi PROJECT_CONTEXT.md sezione sicurezza.
const revokedAdminTokens = new Set<string>();
```

- [ ] **Step 3: Verifica type-check**

Run: `npm run build`
Expected: nessun errore (solo commenti).

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/rate-limit.ts src/lib/auth/session.ts
git commit -m "docs: document in-memory rate-limit and token revocation limits"
```

---

### Task 6: Rivedere la CSP in `next.config.js`

**Files:**
- Modify: `next.config.js` (sezione CSP, righe 1-65 circa — leggere il file corrente prima di modificare)

**Interfaces:**
- Nessuna interfaccia di codice — solo header HTTP.

- [ ] **Step 1: Leggere la CSP attuale e capire cosa la usa**

Leggere `next.config.js` per intero e cercare nel codice (`Grep` su `dangerouslySetInnerHTML`, `<script`, `eval(`, `new Function(`) eventuali usi che richiedono `unsafe-inline`/`unsafe-eval`. Verificare anche se Next.js 16 con React Compiler richiede `unsafe-eval` in dev (spesso sì, per HMR) — in tal caso valutare se la CSP è diversa tra dev e prod nel file.

- [ ] **Step 2: Provare a stringere `script-src` solo se sicuro**

Se dall'analisi risulta che `unsafe-eval` è necessario solo in sviluppo, condizionarlo a `process.env.NODE_ENV !== "production"` nell'array `scriptSrc` (se non è già così). Non rimuovere `unsafe-inline` se ci sono script inline di terze parti (YouTube embed, analytics) senza prima introdurre nonce — introdurre nonce è un cambio architetturale più ampio, fuori scopo per una "rifinitura non drastica"; se necessario, lasciare `unsafe-inline` e documentare il perché in un commento.

- [ ] **Step 3: Verifica manuale in browser**

Con `npm run dev` e poi con `npm run build && npm run start` (per testare la CSP di produzione), aprire la Console del browser su home, eventi, icone, e una pagina con iframe YouTube/Google Drive. Verificare che non compaiano errori CSP (`Refused to...`) e che video/iframe si carichino correttamente.

- [ ] **Step 4: Commit (solo se sono stati fatti cambi reali)**

```bash
git add next.config.js
git commit -m "chore: tighten CSP script-src where safe to do so"
```

Se dall'analisi risulta che nulla può essere stretto senza rompere funzionalità reali, non fare commit di codice: riportarlo come nota nel riepilogo finale e in `PROJECT_CONTEXT.md` (Task 15).

- [ ] **Step 5: Eseguire la skill `security-review` sul diff dei Task 1-6**

Eseguire la skill `security-review` sul diff accumulato finora (fix di autenticazione, JWT, guard, CSP) come secondo controllo indipendente prima di proseguire con l'audit più ampio del Task 7. Valutare criticamente ogni finding (non applicare alla cieca) e correggere solo quelli confermati, con relativo commit.

---

### Task 7: Audit di problemi analoghi su tutte le API pubbliche

**Files:**
- Nessun file predeterminato: l'esito dipende dai findings. Modificare solo i file dove viene confermato un problema reale.

**Interfaces:**
- Consumes: `requireAdminSession`/`requireSuperAdminSession` da `session.ts`; pattern di validazione già in uso nel repo (es. controlli `if (!body.x)` visti in `users/route.ts`).

- [ ] **Step 1: Mappare tutte le route pubbliche**

Run: elencare tutti i file con `Glob` su `src/app/api/**/route.ts` esclusi quelli già coperti nei Task 2-3 e nella lista "confermata presente" originale (`users`, `utenti`, `iscrizioni*`, `richieste-*`, `login`, `logout`). Per ognuna delle rimanenti (`api/auth/*`, `api/public/*`, `api/youtube/*`, ed eventuali altre trovate), leggere il file per intero.

- [ ] **Step 2: Verificare autorizzazione/IDOR**

Per ogni route che accetta un `id`/parametro identificativo in input (es. `change-password`, `update-profile`), verificare che l'operazione sia sempre scoperta tramite la sessione dell'utente autenticato (`user_session` via `mongo/sessions.ts`) e mai tramite un ID passato liberamente dal client senza controllo di ownership. Se si trova un endpoint che accetta un ID arbitrario e non verifica che appartenga all'utente/sessione corrente, è un IDOR confermato: correggerlo derivando l'ID sempre dalla sessione server-side, mai dal body/query.

- [ ] **Step 3: Verificare validazione input**

Per ogni endpoint `POST`/`PUT` non ancora controllato, verificare che i campi obbligatori siano validati prima dell'uso (pattern già presente in `users/route.ts:57-76`: controllo presenza, lunghezza minima password, whitelist di valori enum). Se manca completamente (es. nessun controllo su email/username prima dell'insert), aggiungere solo i controlli minimi equivalenti a quelli già usati altrove nel repo per lo stesso tipo di campo — non introdurre una libreria di validazione nuova.

- [ ] **Step 4: Verificare upload/gestione file**

Cercare con `Grep` route che gestiscono file (`multipart`, `FormData`, `pdf-lib`, `gdrive`) e verificare che siano protette da sessione admin dove previsto e che non espongano path traversal o accesso a file arbitrari.

- [ ] **Step 5: Cercare secret hardcoded**

Run: `Grep` su `src/` per pattern come `sk-`, `AIza`, stringhe che assomigliano a chiavi API, password hardcoded, o altri fallback deboli simili a quello già trovato in `jwt.ts` (pattern `process.env.X || "..."` con una stringa non vuota come secondo operando, su file di `src/lib/auth/` e `src/lib/mongo/`).

- [ ] **Step 6: Cercare altra logica auth duplicata**

Run: `Grep` su `src/app/api/` per `cookies().get("admin_session")` o `cookies().get("user_session")` fuori da `session.ts`/`mongo/sessions.ts`, per trovare altri punti (oltre a `section-visibility`, già sistemato nel Task 3) che reimplementano localmente la verifica invece di riusare gli helper condivisi.

- [ ] **Step 7: Correggere solo i problemi confermati**

Per ogni problema confermato nei Step 2-6, applicare il fix minimo (stesso pattern usato altrove nel repo per problemi equivalenti). Non "riparare" codice che già funziona correttamente. Annotare in una lista (da riportare nel riepilogo finale e in `PROJECT_CONTEXT.md`) sia i problemi corretti sia gli eventuali sospetti non confermati/non affrontati e perché.

- [ ] **Step 8: Verifica type-check**

Run: `npm run build`
Expected: nessun errore nei file modificati in questo task.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix: address additional auth/validation issues found in API audit"
```

Se non emergono problemi da correggere, non fare commit di codice: riportarlo esplicitamente nel riepilogo finale.

---

### Task 8: Sostituire gli `alert()` nativi con `AdminToast`

**Files:**
- Modify: `src/app/admin/(dashboard)/gestione-admin/page.tsx` (12 occorrenze di `alert(`)
- Modify: `src/app/admin/(dashboard)/utenti/page.tsx` (4 occorrenze di `alert(`)

**Interfaces:**
- Consumes: `showToast(text: string, type?: "success" | "error"): void` da `src/components/admin/AdminToast.tsx` (già montato globalmente nel layout dashboard, Task 4).

- [ ] **Step 1: Leggere entrambi i file per intero**

Leggere `src/app/admin/(dashboard)/gestione-admin/page.tsx` e `src/app/admin/(dashboard)/utenti/page.tsx` per capire il testo esatto e il contesto (successo/errore) di ciascuna delle 16 chiamate `alert(...)` totali.

- [ ] **Step 2: Aggiungere l'import**

In entrambi i file, aggiungere in cima:

```ts
import { showToast } from "@/components/admin/AdminToast";
```

- [ ] **Step 3: Sostituire ogni `alert(...)`**

Per ogni occorrenza, sostituire `alert("testo")` con `showToast("testo", "success")` se il messaggio comunica un esito positivo (es. "Salvato", "Creato con successo"), oppure `showToast("testo", "error")` se comunica un errore/fallimento (es. "Errore durante il salvataggio", validazioni fallite). Il testo del messaggio resta identico a quello originale — solo il meccanismo di visualizzazione cambia.

- [ ] **Step 4: Verifica type-check**

Run: `npm run build`
Expected: nessun errore.

- [ ] **Step 5: Verifica manuale**

Da loggato come superadmin, in `gestione-admin` ed `utenti`, eseguire almeno un'azione che prima mostrava un `alert()` di successo e una che mostrava un `alert()` di errore (es. tentare un'operazione con dati non validi), verificando che compaia il toast in basso a destra invece del popup nativo del browser.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(dashboard)/gestione-admin/page.tsx" "src/app/admin/(dashboard)/utenti/page.tsx"
git commit -m "fix: replace native alert() with AdminToast in admin pages"
```

---

### Task 9: Redirect al login su risposta 401 durante l'uso della dashboard

**Files:**
- Create: `src/lib/admin/fetch-with-auth-redirect.ts`
- Modify: pagine admin che fanno fetch client-side verso `/api/admin/*` (da individuare con Grep nello Step 1; tipicamente tutte le pagine sotto `src/app/admin/(dashboard)/*/page.tsx` che usano `fetch(`)

**Interfaces:**
- Produces: `export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>` — wrapper su `fetch` che, se la risposta ha `status === 401`, esegue `window.location.href = "/admin/login"` e poi ritorna comunque la `Response` (il chiamante può interrompere la propria logica controllando `response.status`).
- Consumes: nessuna dipendenza esterna nuova.

- [ ] **Step 1: Creare l'helper**

Creare `src/lib/admin/fetch-with-auth-redirect.ts`:

```ts
"use client";

/**
 * Wrapper su fetch per le chiamate client-side verso /api/admin/*.
 * Se la sessione è scaduta/assente (401), reindirizza al login invece
 * di lasciare che la pagina mostri tabelle vuote o errori silenziosi.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
  return response;
}
```

- [ ] **Step 2: Individuare le pagine da aggiornare**

Run: `Grep -rn "fetch(\"/api/admin" src/app/admin` (e varianti con apici singoli/template string) per elencare tutte le pagine client (`"use client"`) che fanno fetch dirette verso `/api/admin/*`.

- [ ] **Step 3: Sostituire `fetch` con `adminFetch` nelle chiamate verso `/api/admin/*`**

In ogni pagina trovata, aggiungere `import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";` e sostituire le chiamate `fetch("/api/admin/...")` con `adminFetch("/api/admin/...")`, lasciando invariata ogni altra logica (parsing della risposta, gestione errori esistente per altri status code diversi da 401).

- [ ] **Step 4: Verifica type-check**

Run: `npm run build`
Expected: nessun errore.

- [ ] **Step 5: Verifica manuale — sessione scaduta durante l'uso**

Login admin, aprire una pagina con tabella (es. eventi), poi in un'altra tab fare logout (o cancellare manualmente il cookie `admin_session` da DevTools → Application → Cookies). Tornare alla prima tab e forzare un refetch (es. cliccare "aggiorna" o un'azione che chiama l'API): verificare il redirect a `/admin/login` invece di una tabella vuota o un errore silenzioso in console.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/fetch-with-auth-redirect.ts
git add -A
git commit -m "feat: redirect to admin login on 401 during client-side fetches"
```

---

### Task 10: Verificare gli stati vuoti delle sezioni pubbliche

**Files:**
- Nessun file predeterminato: verificare, correggere solo dove manca uno stato vuoto curato.

- [ ] **Step 1: Elencare le pagine pubbliche con contenuto dinamico**

`src/app/(main)/page.tsx`, `eventi/page.tsx`, `icone/page.tsx`, `libreria/page.tsx`, `orari/page.tsx`, `preghiere/page.tsx`, `video-corsi/page.tsx`.

- [ ] **Step 2: Per ognuna, verificare il rendering a collezione vuota**

Leggere il componente e la logica di fetch/store per capire cosa viene renderizzato quando l'array di contenuti è vuoto (es. `eventi.length === 0`). Verificare che esista un messaggio o componente di stato vuoto dedicato (non una lista bianca senza spiegazione, non un errore).

- [ ] **Step 3: Correggere solo le sezioni prive di stato vuoto curato**

Se una sezione non ha stato vuoto (mostra semplicemente nulla o un contenitore vuoto), aggiungere un blocco minimale coerente con lo stile delle altre sezioni che già lo hanno (riusare lo stesso pattern/componente, non inventarne uno nuovo).

- [ ] **Step 4: Verifica manuale**

Con `npm run dev`, se possibile svuotare temporaneamente una collezione di test (o verificare a occhio leggendo il codice se non è praticabile svuotare dati reali), controllare visivamente ogni sezione.

- [ ] **Step 5: Commit (solo se sono stati fatti cambi)**

```bash
git add -A
git commit -m "fix: add missing empty states on public sections"
```

---

### Task 11: Consolidare l'admin sui token semantici del design system

**Files:**
- Modify: pagine e componenti sotto `src/app/admin/**` e `src/components/admin/**` che usano classi hardcoded (`bg-gray-*`, `text-gray-*`, `border-gray-*`, mix `gold`/`amber-*`) — inclusi almeno `eventi/page.tsx`, `gestione-admin/page.tsx`, `utenti/page.tsx`, `AdminSidebar.tsx`, `AdminToast.tsx`, `layout.tsx` (Task 4).

**Interfaces:**
- Consumes: token CSS già definiti in `src/app/globals.css` (`--color-background`, `--color-foreground`, `--color-surface`, `--color-surface-alt`, `--color-surface-2`, `--color-border`) e relative classi Tailwind (`bg-background`, `text-foreground`, `bg-surface`, `bg-surface-2`, `border-border`).

- [ ] **Step 1: Invocare la skill `ui-ux-pro-max` per una diagnosi strutturata**

Eseguire la skill (o `21st-ui-review` se disponibile/utile) sul confronto tra pagine admin e sito pubblico, per ottenere una lista puntuale di dove sostituire classi hardcoded con token semantici e in che ordine di priorità.

- [ ] **Step 2: Mappare tutte le occorrenze**

Run: `Grep -rn "bg-gray-|text-gray-|border-gray-" src/app/admin src/components/admin` per la lista completa dei file da toccare.

- [ ] **Step 3: Sostituire con la mappatura equivalente**

Applicare una mappatura 1:1 e meccanica (nessun cambio di layout): `bg-gray-50`/`bg-white` di sfondo pagina → `bg-background`; `bg-white` di card/contenitori → `bg-surface`; `bg-gray-50`/`bg-gray-100` di contenitori secondari → `bg-surface-2` o `bg-surface-alt` (scegliere in base al contrasto visivo più vicino all'originale); `text-gray-900`/`text-gray-800` → `text-foreground`; `text-gray-500`/`text-gray-400` → lasciare invariati se non esiste un token "muted" equivalente (non inventarne uno nuovo fuori scopo); `border-gray-200`/`border-gray-100` → `border-border`. Per il mix `gold`/`amber-*`, uniformare su qualunque delle due sia già usata come colore principale del brand nel pubblico (verificare in `Navbar.tsx`) e sostituire l'altra.

- [ ] **Step 4: Verifica visiva in browser**

Con `npm run dev`, aprire ogni pagina admin modificata e confrontare visivamente con lo stato precedente (via git diff o screenshot mentale): nessun elemento deve apparire rotto, illeggibile o con contrasto insufficiente.

- [ ] **Step 5: Verifica type-check e lint**

Run: `npm run build && npm run lint`
Expected: nessun errore.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "style: consolidate admin UI on semantic design tokens"
```

---

### Task 12: Rifiniture leggere sul sito pubblico (IT + AR/RTL)

**Files:**
- Nessun file predeterminato: dipende dalla diagnosi della skill `ui-ux-pro-max`.

- [ ] **Step 1: Diagnosi**

Invocare `ui-ux-pro-max` (ed eventualmente `21st-ui-review`) sul sito pubblico per individuare incoerenze reali (ritmo spazi, gerarchia tipografica, contrasto, stati hover/focus mancanti). Annotare solo i findings con una motivazione chiara in una frase.

- [ ] **Step 2: Applicare solo le rifiniture motivabili**

Per ogni finding confermato, applicare la modifica minima (classi Tailwind esistenti nel design system, non nuovi colori/font/breakpoint). Nessun cambio di struttura HTML, palette o layout.

- [ ] **Step 3: Verifica IT**

Con `npm run dev`, navigare le pagine toccate in italiano e verificare visivamente ogni modifica.

- [ ] **Step 4: Verifica AR/RTL**

Ripetere la verifica con `next-intl` impostato su `ar` (cambiare lingua da UI o navigare `/ar/...` a seconda del routing configurato in `src/i18n/request.ts`), verificando che il layout RTL e il font `Noto_Naskh_Arabic` restino corretti su ogni elemento toccato.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: light UI refinements on public site (IT/AR)"
```

Se la diagnosi non trova incoerenze reali motivabili, non fare commit e riportarlo nel riepilogo finale.

---

### Task 13: Verifica completa e lint/build

**Files:** nessuna modifica di codice prevista in questo task, salvo fix di lint/build che emergano.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: nessun errore. Se emergono errori, correggerli nei file indicati (fix mirato, non disabilitare regole).

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build di produzione completata senza errori.

- [ ] **Step 3: Avviare l'app con la skill `run`**

Usare la skill `run` per avviare il dev server e condurre in browser il checklist completo di verifica manuale: login admin, logout, accesso diretto a `/admin/eventi` senza sessione (redirect a login atteso), CRUD completo su eventi, navigazione sito pubblico IT e AR (incluse le rifiniture grafiche), caricamento immagini e iframe YouTube/Google Drive senza errori CSP in console.

- [ ] **Step 4: Applicare `superpowers:verification-before-completion`**

Non dichiarare nulla "risolto" senza aver osservato l'esito di ogni verifica dello Step 3 con i propri occhi (screenshot o descrizione puntuale di cosa si è visto).

- [ ] **Step 5: Commit (solo se ci sono fix)**

```bash
git add -A
git commit -m "fix: address lint/build issues found during verification"
```

---

### Task 14: Code review e revisione finale

- [ ] **Step 1: Eseguire la skill `code-review` a livello `high` sul diff completo** (branch `fix/security-ux-graphics-audit` vs `main`).

- [ ] **Step 2: Per ogni osservazione emersa, usare `superpowers:receiving-code-review`** per valutarla criticamente (non accettare/applicare alla cieca) e applicare solo le correzioni valide.

- [ ] **Step 3: Commit delle eventuali correzioni**

```bash
git add -A
git commit -m "fix: address code review feedback"
```

---

### Task 15: Aggiornare `PROJECT_CONTEXT.md`

**Files:**
- Modify: `PROJECT_CONTEXT.md`

- [ ] **Step 1: Aggiornare la sezione 6.4 (Sessioni e autenticazione)**

Aggiungere, dopo il paragrafo esistente, lo stato reale post-fix: tutte le route `/api/admin/*` ora richiedono `requireAdminSession`/`requireSuperAdminSession`; il layout `src/app/admin/(dashboard)/layout.tsx` esegue un controllo server-side centralizzato con redirect a `/admin/login`; `ADMIN_SESSION_SECRET` non ha più fallback (l'app fallisce esplicitamente se assente); nota sul fatto che eventuali token firmati in passato con la chiave pubblica come fallback sono stati automaticamente invalidati dalla rimozione del fallback stesso (nessuna rotazione manuale eseguita, non necessaria); limiti noti rimasti aperti su rate-limit e revoca token in-memory (non persistono tra istanze Vercel) con riferimento ai commenti in `rate-limit.ts`/`session.ts`.

- [ ] **Step 2: Aggiungere una sottosezione sulle convenzioni grafiche admin**

In una nuova sottosezione (es. "6.6 Convenzioni UI admin" o nella sezione struttura), documentare che il pannello admin ora usa gli stessi token semantici del pubblico (`bg-background`, `bg-surface`, `bg-surface-2`, `text-foreground`, `border-border` da `globals.css`) invece di classi Tailwind hardcoded, per coerenza col brand e per abilitare un eventuale dark mode futuro — e che nuove pagine admin devono seguire questa convenzione.

- [ ] **Step 3: Aggiornare ogni altra sezione resa non accurata**

Rileggere l'intero documento e correggere puntualmente (non solo in un changelog finale) qualunque altra affermazione che i cambi di questo piano abbiano reso non più vera (es. se la Fase 2 ha trovato e corretto altri problemi, documentarli nella sezione pertinente; se il redirect-to-login client-side è stato aggiunto, menzionarlo dove si parla del flusso admin).

- [ ] **Step 4: Non rimuovere informazioni ancora valide**

Verificare che nessuna sezione esistente venga cancellata se ancora accurata — solo integrata/corretta.

- [ ] **Step 5: Commit**

```bash
git add PROJECT_CONTEXT.md
git commit -m "docs: update PROJECT_CONTEXT.md with post-audit security and UI state"
```

---

### Task 16: Chiusura del branch

- [ ] **Step 1: Riepilogo finale in italiano per l'utente**

Preparare un riepilogo: cosa era vulnerabile, cosa è stato corretto (Task 1-10), quali miglioramenti grafici sono stati applicati e perché (Task 11-12), cosa resta aperto (rate-limit/revoca in-memory, eventuali sospetti non confermati dal Task 7, eventuale CSP non stretta dal Task 6 con motivazione).

- [ ] **Step 2: Invocare `superpowers:finishing-a-development-branch`**

Data l'urgenza sicurezza, valutare merge diretto su `main` vs PR seguendo le indicazioni della skill; se serve una PR e il server MCP GitHub non è connesso, usare `gh` via Bash.
