# Colonna `ha_pagato` per le iscrizioni eventi

## Scopo

La collezione MongoDB `event_registrations` supporta ora il campo booleano `ha_pagato`, usato per tracciare rapidamente lo stato di pagamento di ogni iscrizione evento.

## Comportamento

- Nuove iscrizioni: il campo viene creato automaticamente con valore `false`.
- Iscrizioni storiche prive del campo: in lettura vengono trattate come `false`, così la UI resta compatibile senza migrazioni bloccanti.
- Valori ammessi: solo booleani `true` e `false`.

## Backend

- Modello TypeScript: `src/types/index.ts`
- CRUD Mongo: `src/lib/mongo/registrations.ts`
- API admin iscrizioni: `src/app/api/admin/iscrizioni/route.ts`
- Export admin: `src/app/api/admin/iscrizioni/export/route.ts`

### Aggiornamento atomico

Per il solo cambio dello stato pagamento viene usato un update atomico dedicato:

- funzione: `updateIscrizionePagamento(id, ha_pagato)`
- operazione Mongo: `updateOne({ _id }, { $set: { ha_pagato, updatedAt } })`

Questo evita overwrite involontari di altri campi dell'iscrizione durante il click sulla checkbox.

## Interfaccia admin

Nel pannello `Admin > Iscrizioni` è presente una colonna `Pagamento` con:

- checkbox cliccabile
- stato testuale `Pagato` / `Da saldare`
- feedback visuale `Salvataggio...`
- feedback visuale `Salvato` dopo l'update riuscito

Ogni interazione invia una richiesta `PATCH` asincrona all'endpoint:

`/api/admin/iscrizioni?id=<iscrizioneId>`

con payload:

```json
{ "ha_pagato": true }
```

oppure

```json
{ "ha_pagato": false }
```

## Validazione

L'API rifiuta payload non validi per `ha_pagato`.

Esempi non ammessi:

- `"true"`
- `"false"`
- `1`
- `0`
- `null`
- oggetti o array

## Compatibilità

- Le query `getIscrizioniByEvento()` e `getIscrizioniByUser()` restituiscono sempre `ha_pagato`.
- Le esportazioni admin includono la colonna `Pagato`.
- Il form pubblico di iscrizione non può impostare `ha_pagato`: il valore iniziale resta server-side a `false`.
