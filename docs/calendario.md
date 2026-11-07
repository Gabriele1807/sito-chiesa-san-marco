# Calendario copto-gregoriano

Pagina pubblica: `/calendario`. Pannello: **Admin → Calendario liturgico** (`/admin/calendario`).

Il calendario è il "motore" a cui vanno agganciate le letture giornaliere. La
conversione delle date, la Pasqua, il tramonto e il risolutore del giorno
liturgico stanno **nel codice** e non dipendono da MongoDB né dalla rete: non
c'è nessuna tabella annuale da aggiornare. Nel database ci sono solo i
**contenuti** (Sinassario, letture, note) e le **impostazioni** modificabili.

## 1. Struttura

| Livello | File | Ruolo |
|---|---|---|
| Logica pura | `src/lib/calendario/jdn.ts` | Gregoriano/giuliano ↔ Julian Day Number (JDN), giorno della settimana |
| | `coptic.ts` | Copto ↔ JDN, bisestili, chiavi `AAAA-MM-GG` e `MM-GG` |
| | `months.ts` | Nomi dei 13 mesi (bohairico, arabo; copto predisposto) |
| | `easter.ts` | Pasqua copta (Meeus, computo giuliano → JDN) |
| | `sun.ts` | Tramonto NOAA/Meeus, locale, ±1-2 minuti |
| | `tz.ts` | Fusi orari con `Intl`: giorno locale, mezzanotte, orario → istante |
| | `rules.ts` | Regole liturgiche certe e catalogo delle regole incerte |
| | `resolver.ts` | `resolveLiturgicalDay(jdn, config)` → descrizione strutturata (memoizzata) |
| | `content.ts` | Tipo `DayContent`, chiavi dei contenuti, provider a tre livelli |
| | `lookup.ts` | Ricerca di un giorno a partire da una chiave (anteprima admin) |
| Servizio | `src/lib/calendario/service.ts` | `computeDayState(istante, fuso, località, tramontoManuale?)` |
| Dati (server) | `src/lib/mongo/calendario.ts` | Collezioni, validazione, seed |
| | `src/lib/calendario-data.ts` | Letture pubbliche con cache e timeout (ripiego senza errori) |
| API | `src/app/api/calendario/giorno` | Contenuti pubblicati per chiave |
| | `src/app/api/admin/calendario/*` | Contenuti, feste, regole, impostazioni (solo admin) |
| Interfaccia | `src/components/calendario/*` | Pagina pubblica |
| | `src/components/admin/calendario/*` | Pannello admin |

## 2. Logica del calendario

### Numeri di giorno

Ogni giorno civile è un intero (JDN; 2451545 = 1 gennaio 2000). Le conversioni
sono aritmetiche: niente stringhe e niente `Date` per i calcoli, quindi fusi e
ora legale non possono spostare una data. Le `Date` servono solo come istanti
assoluti (millisecondi).

### Calendario copto

- Epoca: 1 Thout 1 A.M. = JDN 1825030 (29 agosto 284 giuliano).
- 12 mesi da 30 giorni più Nasi, di 5 giorni o di 6 se (anno + 1) è divisibile per 4.
- `copticToJdn(a, m, g) = 1825029 + 365(a−1) + ⌊a/4⌋ + 30(m−1) + g`.
- Il ciclo copto è giuliano. Per questo tra il 1900 e il 2099 il Capodanno cade
  l'11 settembre, o il 12 nell'anno che precede un bisestile gregoriano; dal 2100
  slitta di un giorno. Il calcolo per JDN lo gestisce senza eccezioni.
- La differenza tra anno gregoriano e anno copto è 284 prima del Capodanno copto
  e 283 dopo.

### Pasqua

Computo giuliano di Meeus (`a = Y mod 4`, `b = Y mod 7`, `c = Y mod 19`,
`d = (19c + 15) mod 30`, `e = (2a + 4b − d + 34) mod 7`). La data giuliana
ottenuta viene convertita in JDN, quindi vale per qualsiasi anno.
La Pasqua dell'anno copto *A* è quella della primavera dell'anno gregoriano *A + 284*.

### Giorno civile e giorno liturgico

- **Giorno civile**: il giorno gregoriano del fuso del dispositivo, da mezzanotte a mezzanotte.
- **Giorno liturgico**: il giorno copto, da tramonto a tramonto. Dopo il tramonto
  del giorno civile *G* il giorno liturgico è già quello di *G+1*.

`computeDayState` restituisce entrambi, il tramonto usato (astronomico, manuale
o di ripiego alle 18:00 se il Sole non tramonta) e il **prossimo evento**
(`nextChangeAt`: tramonto o mezzanotte).

L'interfaccia programma **un solo `setTimeout`** su quell'istante
(`useLiveClock`). Lo ricalcola quando la scheda torna visibile
(`visibilitychange`/`pageshow`) e comunque almeno una volta l'ora, per coprire
la sospensione del dispositivo. Non c'è un orologio al secondo.

Località: quella scelta dal visitatore (città preimpostata, posizione del
dispositivo, coordinate o tramonto manuale), altrimenti quella predefinita
dall'admin, Milano di partenza. Le preferenze del visitatore restano solo in
`localStorage` (`calendario:prefs:v1`).

### Regole

Implementate perché certe (`rules.ts`), come distanza dalla Pasqua E±N o data copta:

| Periodo | Regola |
|---|---|
| Digiuno di Giona | E−69 … E−67 |
| Grande Quaresima | E−55 … E−8 |
| Settimana Santa | E−7 … E−1 |
| Santa Cinquantina | E+0 … E+49 (Pentecoste) |
| Digiuno degli Apostoli | E+50 … 4 Epip (festa il 5 Epip) |
| Digiuno della Natività | 16 Hathor … vigilia del Natale (28 Koiak se la regola del Natale è disattivata) |
| Feste mobili | Palme E−7, Pasqua E+0, Ascensione E+39, Pentecoste E+49 |
| Feste fisse (predefinite) | Nayrouz 1 Thout, Croce 17 Thout, Epifania 11 Tobi, Annunciazione 29 Paremhat, Apostoli 5 Epip, Assunzione 16 Mesori |

**Regole incerte**, nel catalogo `CONFIGURABLE_RULES`: sono tutte **disattivate**
finché un admin non sceglie un valore. Finché restano disattivate il risolutore
non indovina e segnala il giorno in `uncertain`; sul sito compare "alcune regole
sono ancora in verifica".

| Id | Valori | Se disattivata |
|---|---|---|
| `natale` | `29-koiak`, `7-gennaio` | Natale non mostrato; digiuno fino al 28 Koiak |
| `nasi6` | `contenuti-propri`, `come-5-nasi` | Chiave fissa `13-06` |
| `concomitanze` | `mostra-entrambe`, `prevale-stagione-mobile` | Festa fissa e Settimana Santa/Pasqua mostrate insieme |
| `mercolediVenerdi` | (predisposta, **non implementata**) | Non calcolato; non attivabile |

TODO aperti, da verificare con il clero:
- data del Natale negli anni in cui il 29 Koiak cade l'8 gennaio, e inizio/fine
  del digiuno in quegli anni;
- concomitanze;
- esenzioni del mercoledì e del venerdì;
- Paramoun (vigilie);
- feste mobili minori (Giovedì e Venerdì Santo, Pasqua di Giona, domeniche della Cinquantina).

## 3. Chiavi dei giorni

Per ogni giorno liturgico il risolutore espone:

| Chiave | Formato | Esempio (5 gennaio 2025) | Uso |
|---|---|---|---|
| `coptic` | `AAAA-MM-GG` copto | `1741-04-27` | Identificativo unico del giorno |
| `iso` | `AAAA-MM-GG` gregoriano | `2025-01-05` | Corrispondente gregoriano (del giorno diurno) |
| `fixed` | `MM-GG` copto | `04-27` | **Livello fisso**: Sinassario, feste fisse; vale ogni anno |
| `movable` | `E±N` | `E-105` | **Livello mobile**: giorni dalla Pasqua dello stesso anno liturgico (circa da E−230 a E+135) |
| `seasonal` | `MM-Sn-w` | `04-S4-0` | **Livello stagionale**: mese copto, domeniche già trascorse nel mese (0-5), giorno della settimana (0 = domenica) |

Il livello stagionale identifica le domeniche del mese ("4ª domenica di Koiak" =
`04-S4-0`) e i giorni della settimana che le seguono (`04-S4-3` = il mercoledì
dopo la 4ª domenica). I giorni prima della prima domenica hanno `S0`.

Nel 6 di Nasi la chiave fissa può diventare `13-05` se la regola `nasi6` vale
`come-5-nasi` (`contentKeysFor`).

## 4. Persistenza (MongoDB)

Connessione ed helper sono quelli della repo (`getDb()` in `src/lib/mongo/client.ts`).

| Collezione | Contenuto | Indici unici |
|---|---|---|
| `calendario_contenuti` | `{ id, livello, chiave, stato: "bozza" \| "pubblicato", sinassario?, letture?: { vespri, mattutino, epistole, atti, salmi, vangelo }, note?, createdAt, updatedAt, updatedBy }`, ogni testo `{ it?, ar? }` | `{ livello, chiave }`, `{ id }` |
| `calendario_feste` | `{ id, mese, giorno, nome: { it, ar? }, attiva, origine, createdAt, updatedAt, updatedBy }` | `{ id }` |
| `calendario_regole` | `{ id, attiva, valore, createdAt, updatedAt, updatedBy }` | `{ id }` |
| `calendario_impostazioni` | `{ id: "generale", localita: { name, lat, lon }, … }` | `{ id }` |
| `section_visibility` | Documento `sectionId: "calendario"` (meccanismo esistente) | già presente |

- **Validazione in scrittura**: `validateContenuto`, `validateFesta`,
  `validateRegola` e `validateImpostazioni` accettano solo i campi noti e
  rifiutano operatori MongoDB e tipi errati. Tolgono i caratteri di controllo e
  applicano limiti di lunghezza (40.000 caratteri per testo, 5.000 per le note).
  Il seed applica anche validatori `$jsonSchema` (`validationLevel: moderate`).
- **Letture pubbliche**: solo `stato: "pubblicato"`, senza campi di audit, tre
  chiavi per richiesta, cache di 5 minuti (tag `calendario`, invalidata a ogni
  scrittura admin). Se il database non risponde entro 1,5 s si usano la
  configurazione predefinita e "Letture del giorno in arrivo": la data resta corretta.
- **Scritture**: solo con sessione admin e permesso `calendario.write`
  (`src/lib/auth/permissions.ts`). Ogni scrittura finisce nel registro attività.

### Seed

```bash
npm run seed-calendario
```

È idempotente: usa solo `$setOnInsert`, quindi rieseguirlo non crea duplicati e
non sovrascrive le modifiche dell'admin. Inserisce le 6 feste certe, le regole
disattivate, la località Milano e la sezione di visibilità. Lo stesso seed viene
eseguito in modo pigro alla prima apertura del pannello admin; i validatori
`$jsonSchema` li applica solo lo script.

## 5. Inserire le letture dall'admin

1. **Admin → Calendario liturgico → Contenuti**.
2. Cerca il giorno per data gregoriana o copta. Vengono mostrate le tre chiavi
   del giorno, ciascuna con il proprio stato.
3. Scegli il livello giusto:
   - **Fisso** per ciò che si ripete ogni anno nello stesso giorno copto
     (Sinassario, letture delle feste fisse);
   - **Mobile** per ciò che dipende dalla Pasqua (Quaresima, Settimana Santa, Cinquantina…);
   - **Stagionale** per le domeniche dei mesi e i giorni che le seguono.
4. Compila Sinassario, letture e note in italiano e/o arabo. Usa **Anteprima**
   per vedere il giorno come apparirà sul sito, bozze comprese.
5. Salva come **Bozza** o **Pubblicato**: solo i contenuti pubblicati sono visibili sul sito.

Se un giorno ha contenuti su più livelli, il sito li mostra insieme, sezione per
sezione, in quest'ordine: mobile, stagionale, fisso.

Per importazioni in blocco si può scrivere direttamente in `calendario_contenuti`
rispettando lo schema sopra (una riga per `livello` + `chiave`). Conviene però
passare da `validateContenuto` e `upsertContenuto`.

## 6. Impostare una regola incerta

1. **Admin → Calendario liturgico → Regole**.
2. Scegli un valore per la regola, spunta "Applica questa regola" e salva.
   Senza valore la regola non si può attivare, e le regole solo predisposte non
   si possono attivare affatto.
3. L'effetto è immediato sul sito, dopo al massimo 5 minuti di cache.
   Togliendo la spunta si torna al valore sicuro.

Per aggiungere una nuova regola:
1. aggiungila a `CONFIGURABLE_RULES` in `rules.ts`, con `defaultEnabled: false`;
2. applicala in `resolver.ts` (o in `contentKeysFor` se cambia le chiavi);
3. aggiungi nome, descrizione e valori in `adminCalendario.regole` di `it.json` e `ar.json`;
4. scrivi i test in `resolver.test.ts`;
5. esegui `npm run seed-calendario` per creare il documento disattivato.

## 7. Estensioni previste

- `DayContent.feast` e `DayContent.season` sono già predisposti per dati
  aggiuntivi (titoli, colori, inni): vanno aggiunti a `validateContenuto` e allo schema.
- Nomi dei mesi in copto: campo `coptic` in `months.ts`, oggi vuoto; `copticMonthName(m, "coptic")`.
- Nuove feste mobili: `MOVABLE_FEASTS` in `rules.ts` (offset dalla Pasqua).

## 8. Test

```bash
npm test
```

| File | Cosa copre |
|---|---|
| `src/lib/calendario/calendar.test.ts` | Conversioni, casi di riferimento, Capodanno 1800-2200, andata e ritorno, Pasqua |
| `src/lib/calendario/service.test.ts` | Tramonto, mezzanotte, ora legale, fusi diversi, latitudini polari |
| `src/lib/calendario/resolver.test.ts` | Stagioni, digiuni, feste, regole, copertura di anni normali e bisestili, chiavi |
| `src/lib/mongo/calendario.test.ts` | Validazione, solo contenuti pubblicati, seed idempotente |
| `src/lib/calendario-data.test.ts` | Database irraggiungibile o lento |
| `src/app/api/admin/calendario/routes.test.ts` | Permessi (401 senza admin), input non validi |
| `src/app/api/calendario/giorno/route.test.ts` | API pubblica: chiavi, solo pubblicati, database giù, visibilità |
