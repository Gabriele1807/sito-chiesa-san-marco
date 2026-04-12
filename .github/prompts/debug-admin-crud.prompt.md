---
description: "Usa quando eliminazione o aggiornamento dati lato admin non funziona più. Diagnostica step-by-step: sessione, API route, store in memoria, UI, output console."
name: "Debug Admin CRUD"
argument-hint: "Descrivi brevemente cosa non funziona (es. 'elimina icona', 'aggiorna orario')"
agent: agent
tools: [read_file, grep_search, run_in_terminal, get_errors, semantic_search]
---

Leggi il file di contesto del progetto per avere tutta l'architettura necessaria:
[PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)

---

## Obiettivo

Diagnosticare e risolvere il problema per cui **$0** non funziona più nell'area admin.

Segui **sempre tutti gli step in ordine**, anche se ti sembra di aver già trovato il problema dopo il primo.

---

## Step 1 — Identifica la feature coinvolta

Determina qual è il tipo di dato (icone, preghiere, eventi, orari, libreria, libreria-privata, utenti) e l'operazione (DELETE / PUT / PATCH).

Individua i file coinvolti:
- **API route**: `src/app/api/admin/<tipo>/route.ts`
- **Store in memoria**: `src/lib/data/store.ts`
- **Pagina admin**: `src/app/admin/(dashboard)/<tipo>/page.tsx`

---

## Step 2 — Verifica la sessione admin

Prima di guardare la logica CRUD, controlla che la sessione sia valida.

Leggi `src/middleware.ts` e verifica:
- Che la route `/api/admin/<tipo>` non sia accidentalmente esclusa dalla protezione
- Che gli header `x-admin-user-id`, `x-admin-ruolo` vengano iniettati correttamente

Leggi `src/lib/auth/session.ts`:
- Verifica che la funzione di validazione sessione non restituisca `null` in casi limite (token scaduto, cookie mancante)

**Output atteso dallo step**: conferma che la protezione middleware è attiva e che la sessione è letta correttamente nelle API route coinvolte.

---

## Step 3 — Analisi dell'API route

Leggi il file `src/app/api/admin/<tipo>/route.ts` per intero.

Controlla:
1. **Autenticazione interna**: l'handler legge `x-admin-ruolo` / `x-admin-user-id` dagli header? Li usa per controllare i permessi?
2. **Parsing del body**: `DELETE` usa `request.json()` o `searchParams`? Verifica che il campo ID venga letto dal formato corretto inviato dal client
3. **Chiamata allo store**: identifica la funzione dello store invocata (es. `deleteIcona(id)`, `updateOrario(id, data)`)
4. **Risposta HTTP**: restituisce il codice status atteso (`200`, `204`, `400`, `401`, `403`, `404`)?
5. **Errori silenti**: ci sono catch block vuoti o che restituiscono `200` anche in caso di fallimento?

Aggiungi temporaneamente `console.log` all'inizio dell'handler per verificare che la route venga effettivamente raggiunta:

```ts
console.log('[DEBUG] <TIPO> <OPERATION> handler reached', { headers: Object.fromEntries(request.headers) })
```

---

## Step 4 — Analisi dello store in memoria

Leggi `src/lib/data/store.ts`.

Per la funzione CRUD coinvolta verifica:
1. L'ID ricevuto è dello stesso tipo di quello nello store? (number vs string — comune fonte di bug silente)
2. Il confronto usa `===` o `==`? (usare sempre `===`)
3. La funzione `filter` o `findIndex` trova effettivamente l'elemento? Aggiungi log:

```ts
console.log('[DEBUG] store delete <tipo>: id ricevuto=', id, 'tipo=', typeof id, 'items=', store.<tipo>.map(x => x.id))
```

4. `globalThis` viene usato correttamente? Lo store viene esportato una sola volta?

---

## Step 5 — Analisi dell'UI (pagina admin)

Leggi la pagina admin `src/app/admin/(dashboard)/<tipo>/page.tsx`.

Controlla il codice che gestisce il click su "Elimina" o "Salva":
1. Quale URL viene chiamato? Corrisponde esattamente alla API route?
2. Il metodo HTTP (`DELETE`, `PUT`) è corretto?
3. L'ID viene passato nel body, nella query string o nel path? Corrisponde a come la route lo legge?
4. La risposta dell'API viene controllata? Se la fetch fallisce, l'UI mostra un errore o si comporta come se avesse avuto successo?

Aggiungi log nel gestore:

```ts
console.log('[DEBUG] fetch <tipo>, method: <METHOD>, payload:', payload)
const res = await fetch(...)
console.log('[DEBUG] response status:', res.status, await res.clone().text())
```

---

## Step 6 — Esegui il dev server e riproduci il bug

Avvia il server se non è già attivo:

```bash
npm run dev
```

Esegui l'operazione problematica dall'area admin nel browser con i DevTools aperti (tab Network e Console).

Raccogli:
- **Status HTTP** della chiamata (200? 401? 404? 500?)
- **Response body** (messaggio di errore JSON o HTML di errore Next.js)
- **Console del browser**: eventuali errori JS
- **Console del terminale**: i `console.log` aggiunti agli step precedenti

---

## Step 7 — Diagnosi e fix

Basandoti sugli output raccolti, identifica la causa radice. Pattern comuni in questo progetto:

| Sintomo | Causa probabile |
|---------|----------------|
| Status 401 | Cookie `admin_session` scaduto o non inviato; middleware blocca la route |
| Status 403 | Ruolo admin non ha il permesso per questa operazione (vedi `src/lib/auth/permissions.ts`) |
| Status 404 | Elemento non trovato nello store (ID type mismatch: stringa vs numero) |
| Status 200 ma nessun effetto | Handler restituisce 200 senza effettivamente chiamare lo store, o la store function riceve ID sbagliato |
| UI non aggiorna | Il componente non refresha dopo la fetch (manca `router.refresh()` o ricarica dello stato) |
| Store resettato | Il server si è riavviato e `globalThis` ha perso i dati (comportamento atteso, non un bug) |

Proponi il fix minimo necessario, senza refactoring non richiesto.

---

## Step 8 — Pulizia

Rimuovi tutti i `console.log` di debug aggiunti durante la diagnosi prima di chiudere il task.
