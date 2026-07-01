# PROJECT_CONTEXT.md - Chiesa di San Marco (Chiesa Copta Ortodossa di Milano)

> Documento di contesto operativo del progetto. Ultimo aggiornamento: 1 luglio 2026.

---

## 1. Scopo del progetto

Sito web bilingue italiano/arabo per la Chiesa Copta Ortodossa di San Marco a Milano.
Il progetto unisce:

- area pubblica per fedeli e visitatori
- area admin protetta per gestione contenuti e amministratori

L'obiettivo del documento è fornire un quadro aggiornato e realistico dell'architettura, del flow di autenticazione, del layer dati, delle route e delle convenzioni attuali.

---

## 2. Snapshot rapido

| Voce | Valore |
|------|--------|
| Nome progetto | chiesa-san-marco |
| URL dev previsto | http://localhost:3000 |
| Framework | Next.js 16 App Router |
| Lingue | italiano, arabo |
| UI kit | Tailwind CSS v4 |
| i18n | next-intl |
| Persistenza contenuti | MongoDB Atlas |
| Persistenza autenticazione | JWT cookie + MongoDB/Supabase |
| Autenticazione admin | Supabase admin users + `ADMIN_SESSION_SECRET` JWT |
| Autenticazione utenti | JWT cookie `user_session` via MongoDB user store |
| Login unificato | `/api/auth/login` per admin + utenti normali |
| Route admin login | `/admin/login` separata dalla shell admin |
| Route admin protetta | `/admin/(dashboard)` |
| Visibilità sezioni | `src/lib/mongo/visibility.ts` + `SectionVisibilityGate` |
| Residui non usati | `src/lib/supabase/content.ts`, `src/lib/data/store.ts`, `src/proxy.ts` non automaticamente collegato |


---

## 3. Stack tecnologico reale

Versioni lette da `package.json`:

| Tecnologia | Versione | Uso |
|------------|----------|-----|
| next | 16.1.6 | App Router, server components |
| react | 19.2.3 | UI |
| react-dom | 19.2.3 | UI runtime |
| typescript | ^5 | tipizzazione |
| tailwindcss | ^4 | styling |
| @tailwindcss/postcss | ^4 | integrazione Tailwind |
| next-intl | ^4.8.3 | i18n |
| @supabase/supabase-js | ^2.98.0 | Supabase client/server |
| mongodb | ^7.1.1 | persistenza dati |
| bcryptjs | ^3.0.3 | hash password |
| lucide-react | ^0.575.0 | icone |
| react-qr-code | ^2.0.18 | generazione QR |
| babel-plugin-react-compiler | 1.0.0 | React Compiler |
| dotenv | ^17.3.1 | caricamento env |
| eslint | ^9 | lint |
| eslint-config-next | 16.1.6 | configurazione ESLint |
| tailwindcss | ^4 | styling |

Script utili:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run generate-hash -- "password"
```

---

## 4. Architettura e route groups

### 4.1 Route groups reali

- `src/app/(main)` → sito pubblico
- `src/app/admin/(dashboard)` → area admin protetta
- `src/app/admin/login` → login admin separato

### 4.2 Layout principali

- `src/app/layout.tsx`
  - root layout globale
  - carica font Google
  - avvolge con `NextIntlClientProvider`
  - avvolge con `AuthProvider`
  - renderizza `LoginModal` e `RegisterModal`

- `src/app/(main)/layout.tsx`
  - shell pubblica con `Navbar`, `Sidebar`, `Footer`
  - spazio per bottom dock mobile

- `src/app/admin/layout.tsx`
  - layout minimale per la login admin
  - non include sidebar o topbar admin

- `src/app/admin/login/layout.tsx`
  - layout centrato per la pagina di login admin

- `src/app/admin/(dashboard)/layout.tsx`
  - shell admin con `AdminSidebar`, topbar fissa, `AdminToast`
  - area contenuto con `lg:ml-[260px]` e `pt-14`

---

## 5. Layer dati e persistenza

### 5.1 Dati contenuti

- `src/lib/db.ts` è il layer utile per le pagine pubbliche
- usa `unstable_cache` con revalidate 60 e tag di invalidazione
- chiama `src/lib/mongo/content.ts`

### 5.2 Contenuti e seed

- `src/lib/mongo/content.ts` legge e scrive su MongoDB
- collezioni gestite: `icone`, `testi_sacri`, `preghiere`, `eventi`, `orari_settimanali`, `file_privati`
- se le collezioni sono vuote, i getter popolano i mock da `src/lib/mock-data.ts`
- il codice crea indici su slug, data ed altri campi utili

### 5.3 Sessioni e autenticazione

- `src/lib/auth/session.ts` crea e valida JWT admin con `ADMIN_SESSION_SECRET`
- `src/lib/mongo/sessions.ts` crea e valida JWT utenti normali
- non esiste un vero persistere di sessioni in DB nel codice attuale
  - `admin_sessions` e `user_sessions` sono citate in documentazione/schema ma non usate attivamente
- i cookie sono:
  - `admin_session` per admin
  - `user_session` per utenti normali

### 5.4 Autenticazione admin vs utenti normali

- admin users sono memorizzati in Supabase (`admin_users`)
- utenti normali sono memorizzati in MongoDB (`users`)
- login pubblico unificato in `/api/auth/login` tenta prima admin Supabase e poi user MongoDB
- admin login diretto esiste anche in `/api/admin/login`

---

## 6. Autenticazione e auth flow

### 6.1 Root auth client-side

- `src/components/auth/AuthContext.tsx`
  - gestisce stato `guest` / `user` / `admin`
  - espone `showLoginModal`, `showRegisterModal`, `isExplicitGuest`, `refresh`, `logout`
  - chiama `/api/auth/me` all'avvio
  - salva `admin_info` in `localStorage` per lo stato admin

- `src/components/auth/LoginModal.tsx` e `src/components/auth/RegisterModal.tsx`
  - resi a livello root
  - hanno accesso a `AuthContext`

### 6.2 Endpoint importanti

- `POST /api/auth/login` — login unificato admin + utenti normali
- `POST /api/auth/register` — registrazione utenti normali
- `POST /api/auth/logout` — logout utente normale
- `GET /api/auth/me` — stato autentificazione corrente
- `POST /api/auth/change-password` — cambio password
- `POST /api/auth/update-profile` — modifica profilo (utenti normali o admin in base al cookie)
- `GET /api/youtube/channel` — dati canale YouTube con cache

### 6.3 Login unificato

- `src/app/api/auth/login/route.ts` cerca prima `admin_users` in Supabase
- se l'utente admin esiste e la password è valida, imposta `admin_session`
- altrimenti cerca l'utente MongoDB e imposta `user_session`
- la logica di rate limit è in `src/lib/auth/rate-limit.ts`

### 6.4 Auto-promozione admin

- `GET /api/auth/me` verifica sessione `user_session`
- se l'utente MongoDB ha `adminRequest === "approved"`, cerca l'utente corrispondente in Supabase
- se trovato, crea un token admin e imposta `admin_session`
- ritorna `type: "admin"`

### 6.5 Logout admin

- `POST /api/admin/logout` elimina il cookie `admin_session`
- `AuthContext.logout()` chiama endpoint appropriato in base al tipo utente

---

## 7. Section visibility e gate

### 7.1 Come funziona

- il sistema di visibilità è implementato in `src/lib/mongo/visibility.ts`
- dati di default per le sezioni sono definiti in `DEFAULT_SECTIONS`
- la collezione MongoDB `section_visibility` viene popolata al primo avvio se vuota

### 7.2 Gate server-side

- `src/components/SectionVisibilityGate.tsx` chiama `getSectionAccess(sectionId)`
- mostra:
  - contenuto normale se accesso `full`
  - `ComingSoonPage` se accesso `coming_soon`
  - messaggio lock se accesso `hidden`

### 7.3 Sezioni protette attualmente wrappate

- `/eventi`
- `/icone`
- `/libreria`
- `/orari`
- `/preghiere`
- `/video-corsi`

### 7.4 Endpoint client-side per la navbar

- `GET /api/public/section-visibility` fornisce visibilità sezione lato client per la sidebar

---

## 8. Struttura file chiave

### 8.1 Directory principale rilevante

- `src/app/layout.tsx`
- `src/app/(main)/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/login/layout.tsx`
- `src/app/admin/(dashboard)/layout.tsx`
- `src/components/auth/AuthContext.tsx`
- `src/components/auth/LoginModal.tsx`
- `src/components/auth/RegisterModal.tsx`
- `src/components/auth/GuestGate.tsx`
- `src/components/SectionVisibilityGate.tsx`
- `src/components/sidebar/SidebarDock.tsx`
- `src/components/sidebar/MobileDock.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminTopbarTitle.tsx`
- `src/lib/db.ts`
- `src/lib/mongo/content.ts`
- `src/lib/mongo/registrations.ts`
- `src/lib/mongo/sessions.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/rate-limit.ts`
- `src/lib/mongo/visibility.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/content.ts` (residuo)
- `src/lib/data/store.ts` (residuo)

### 8.2 Pagine pubbliche principali

- `src/app/(main)/page.tsx`
- `src/app/(main)/chi-siamo/page.tsx`
- `src/app/(main)/contatti/page.tsx`
- `src/app/(main)/eventi/page.tsx`
- `src/app/(main)/icone/page.tsx`
- `src/app/(main)/icone/[slug]/page.tsx`
- `src/app/(main)/libreria/page.tsx`
- `src/app/(main)/libreria/[slug]/page.tsx`
- `src/app/(main)/orari/page.tsx`
- `src/app/(main)/preghiere/page.tsx`
- `src/app/(main)/profilo/page.tsx`
- `src/app/(main)/video-corsi/page.tsx`
- `src/app/(main)/iscrizioni/page.tsx`

### 8.3 Pagine admin principali

- `src/app/admin/(dashboard)/page.tsx`
- `src/app/admin/(dashboard)/eventi/page.tsx`
- `src/app/admin/(dashboard)/icone/page.tsx`
- `src/app/admin/(dashboard)/libreria/page.tsx`
- `src/app/admin/(dashboard)/libreria-privata/page.tsx`
- `src/app/admin/(dashboard)/orari/page.tsx`
- `src/app/admin/(dashboard)/preghiere/page.tsx`
- `src/app/admin/(dashboard)/video-corsi/page.tsx`
- `src/app/admin/(dashboard)/iscrizioni/page.tsx` — gestione iscrizioni eventi con filtri, riepiloghi pagati/da saldare, ordinamento e export
- `src/app/admin/(dashboard)/utenti/page.tsx` — gestione utenti con filtri per ruolo, fascia d’età e richiesta admin, oltre a review della richiesta tramite modal
- `src/app/admin/(dashboard)/gestione-admin/page.tsx`
- `src/app/admin/(dashboard)/gestione-sezioni/page.tsx`
- `src/app/admin/(dashboard)/gestione-permessi/page.tsx`
- `src/app/admin/login/page.tsx`

### 8.4 API rilevanti

- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/update-profile/route.ts`
- `src/app/api/eventi/iscrizione/route.ts`
- `src/app/api/public/section-visibility/route.ts`
- `src/app/api/youtube/channel/route.ts`
- `src/app/api/admin/login/route.ts`
- `src/app/api/admin/logout/route.ts`
- `src/app/api/admin/eventi/route.ts`
- `src/app/api/admin/icone/route.ts`
- `src/app/api/admin/libreria/route.ts`
- `src/app/api/admin/libreria-privata/route.ts`
- `src/app/api/admin/orari/route.ts`
- `src/app/api/admin/preghiere/route.ts`
- `src/app/api/admin/video-corsi/route.ts`
- `src/app/api/admin/iscrizioni/route.ts` — lista iscrizioni, aggiornamenti stato pagamento e riepiloghi aggregati
- `src/app/api/admin/iscrizioni/export/route.ts` — export CSV delle iscrizioni
- `src/app/api/admin/utenti/route.ts` — lista utenti con filtri ruolo/età/richiesta admin
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/toggle/route.ts`
- `src/app/api/admin/richieste-admin/route.ts`
- `src/app/api/admin/richieste-superadmin/route.ts`
- `src/app/api/admin/section-visibility/route.ts`
- `src/app/api/admin/section-visibility/[sectionId]/route.ts`

---

## 9. Variabili ambiente

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET`
- `MONGODB_URI`
- `MONGODB_DB`
- `YOUTUBE_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (usato come fallback URL in `api/auth/me`)

Note:
- `SUPABASE_SERVICE_ROLE_KEY` è sensibile e va mantenuta server-only
- `ADMIN_SESSION_SECRET` è usato per firmare/verificare JWT
- i cookie admin/user sono `httpOnly`, `secure` in produzione e `sameSite: lax`

---

## 10. Note importanti e limiti attuali

- `src/proxy.ts` esiste ma non è collegato da un middleware `middleware.ts` nel repository corrente;
  quindi non è automaticamente attivo in Next.js come middleware Edge.
- Il progetto usa JWT nei cookie per sessioni, non una tabella di sessioni DB attiva.
- `src/lib/supabase/content.ts` e `src/lib/data/store.ts` sono residui di un layer dati alternativo e non sono usati dalle API pubbliche esistenti.
- La shell admin è separata dalla pagina di login: `/admin/login` usa `src/app/admin/layout.tsx`, mentre l'admin protetto usa `src/app/admin/(dashboard)/layout.tsx`.
- Le pagine pubbliche che usano `SectionVisibilityGate` sono controllate lato server e possono mostrare "coming soon" o "hidden" in base al ruolo.
- Le modifiche CRUD admin dovrebbero invalidare i tag di cache in `src/lib/db.ts` quando aggiornano contenuti pubblici.

---

## 11. Come leggere questo progetto

1. Verifica il layout root in `src/app/layout.tsx`
2. Controlla `src/components/auth/AuthContext.tsx` per il flow auth cliente
3. Leggi `src/app/api/auth/login/route.ts` per la login unificata
4. Leggi `src/lib/mongo/content.ts` e `src/lib/db.ts` per il layer contenuti pubblici
5. Leggi `src/lib/mongo/visibility.ts` e `src/components/SectionVisibilityGate.tsx` per la visibilità sezioni
6. Leggi `src/app/admin/(dashboard)/layout.tsx` prima di modificare l'admin shell

---

## 12. Esempi di flussi chiave

### Login utente normale
- POST `/api/auth/login` con `identifier`, `password`, `rememberMe`
- trova utente MongoDB
- crea JWT `user_session`
- il client chiama `/api/auth/me` per aggiornare lo stato

### Login admin
- POST `/api/auth/login` con username/email e password
- se l'utente è admin su Supabase, crea JWT `admin_session`
- `AuthContext` salva `admin_info` in localStorage e imposta stato `admin`

### Accesso sezione protetta
- `SectionVisibilityGate` legge il cookie
- usa `getSectionAccess(sectionId)`
- restituisce `full`, `coming_soon` o `hidden`

---

## 13. Raccomandazioni rapide

- Non aggiungere una `middleware.ts` senza confermare l'intento di attivare `src/proxy.ts`.
- Non assumere che `admin_sessions` o `user_sessions` siano utilizzate: la sessione è JWT-based.
- Mantieni la separazione login/admin shell.
- Preserva il supporto IT/AR nelle pagine pubbliche.
- Se aggiungi un nuovo contenuto, aggiorna `src/lib/mongo/content.ts`, le API admin e le pagine pubbliche/privato.
