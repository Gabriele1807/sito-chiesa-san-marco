# Calendario copto — stato attuale (per la chat dei prompt)

> Incolla questo file nella chat che prepara i prompt. Descrive cosa esiste
> oggi, cosa è aperto e le regole da rispettare. Dettagli tecnici completi:
> `docs/calendario.md`. Ultimo aggiornamento: 9 novembre 2026, `feat/calendario-copto`
> (6 commit avanti rispetto a `main` @ `374ae25`, non ancora uniti né pubblicati).

## Contesto
- Sito della Chiesa copta ortodossa San Marco: Next.js 16 (App Router, Turbopack),
  React 19, next-intl (it/ar), MongoDB, deploy su Vercel da `main`.
- Il calendario è il "motore" per le future letture del giorno.
- Branch di lavoro: `feat/calendario-copto` (avanti rispetto a `main`, vedi sotto).

## Fasi completate (tutte su `main`)
| Commit | Contenuto |
|---|---|
| `a5fd51d` | Motore puro: conversione copto↔gregoriano (JDN), Pasqua (Meeus giuliano), tramonto, risolutore liturgico |
| `175a6e4` | Persistenza MongoDB, API pubbliche e admin, seed idempotente |
| `ba2b07f` | Pagina pubblica `/calendario` (Live + Manuale) |
| `54bfe3d` | Pannello admin "Calendario liturgico" |
| `6703f8e` | Documentazione `docs/calendario.md` |
| `11ed8f8` | Nuovi nomi dei mesi (Tut … Nassi) |

## Fasi su `feat/calendario-copto` (non ancora su `main`)
| Commit | Contenuto |
|---|---|
| `9167929`, `7b8549a` | Confronto con l'algoritmo alternativo: script `scripts/confronto-algoritmi/` e rapporto `docs/confronto-algoritmi.md` (nessuna differenza su 1-9999) |
| `f8c9072` | Card del calendario nella home (data copta di oggi) |
| `c7a9e24`, `959a3f4` | Feste dell'anno: motore `year.ts` e pagina `/calendario/feste` |

Test: 497 passano (Vitest). Typecheck, lint e build puliti.

## Cosa fa oggi
**Pagina pubblica `/calendario`** (voce nella sidebar, dopo "Orari")
- Live: segue data, ora e fuso del dispositivo; cambia giorno da solo al
  tramonto e a mezzanotte (un solo timer, gestisce scheda in background e ora legale).
- Manuale: qualsiasi data e ora, giorno prima/dopo, "Vai a oggi", ritorno a Live.
- Conversione inversa copto → gregoriano.
- Il giorno liturgico inizia al tramonto della sera prima; giorno civile e
  liturgico sono mostrati separati.
- Tramonto calcolato in locale: predefinito Milano, geolocalizzazione se
  concessa, 5 città preimpostate, oppure orario manuale. Preferenze salvate nel browser.
- Mostra: data copta, anno bisestile, giorno della settimana, domenica del mese,
  distanza da Pasqua, stagione, digiuni, feste, contenuti del giorno pubblicati.
- Funziona anche col database giù (calcola le date, non mostra i contenuti).
- `?data=AAAA-MM-GG` apre la pagina in Manuale su quel giorno (link dall'elenco delle feste).

**Feste dell'anno `/calendario/feste`** (voce nel menu dopo "Calendario copto", link da home e da `/calendario`)
- Anno copto scelto con un selettore (predefinito l'anno corrente, `?anno=N`).
- Feste fisse (dall'admin, predefinite se il DB è giù), feste mobili, digiuni e Santa Cinquantina,
  ordinate per data, con date copta e gregoriana; passate attenuate, prossima evidenziata.
- Natale senza data e 6 Nassi in "In verifica" finché le regole non sono impostate;
  concomitanze segnalate. Ogni voce apre il giorno.

**Card nella home** (sopra "Prossima celebrazione")
- Data copta del giorno civile, calcolata nel browser; link a `/calendario` e `/calendario/feste`.
- Nascosta se la sezione `calendario` non è visibile per il ruolo (lo spazio resta, altezza fissa).

**Pannello admin** (`/admin/calendario`, permessi `calendario.read` / `calendario.write`, solo admin)
- Contenuti: per giorno Sinassario + letture (Vespri, Mattutino, Epistole, Atti,
  Salmi, Vangelo della Liturgia) + note, in it/ar; bozza/pubblicato; anteprima;
  ricerca per data copta o gregoriana.
- Feste fisse: attiva/disattiva, modifica, aggiungi, elimina.
- Regole incerte: tutte disattivate finché non impostate.
- Impostazioni: località predefinita del tramonto; visibilità pubblica della sezione.

## Mesi (nomi visualizzati; l'id è il numero)
1 Tut · 2 Baba · 3 Hatur · 4 Kiahk · 5 Tuba · 6 Hamshir · 7 Baramhat ·
8 Baramoda · 9 Bashans · 10 Baona · 11 Abib · 12 Mesra · 13 Nassi (5 giorni, 6 se bisestile).
Anno bisestile quando (anno + 1) % 4 == 0. Nomi arabi già presenti; scrittura copta vuota.

## Chiavi dei contenuti (non cambiarle: i dati su MongoDB dipendono da queste)
- Fisso: `MM-GG` (es. `01-01` = 1 Tut)
- Mobile da Pasqua: `E+N` / `E-N` (es. `E+0` Pasqua, `E+49` Pentecoste)
- Stagionale: `MM-Sn-w` (mese, n-esima domenica/settimana, giorno settimana 0=dom)
- Anche: data copta `AAAA-MM-GG` e data ISO.

## Feste e digiuni implementati
- Feste fisse predefinite: Nayrouz 1 Tut, Croce 17 Tut, Epifania 11 Tuba,
  Annunciazione 29 Baramhat, Apostoli 5 Abib, Assunzione 16 Mesra.
- Feste mobili: Palme (E-7), Pasqua (E+0), Ascensione (E+39), Pentecoste (E+49).
- Digiuni: Giona (E-69…E-67), Grande Quaresima (E-55…E-8), Settimana Santa
  (E-7…E-1), Cinquantina senza digiuno (E+0…E+49), Apostoli (E+50…4 Abib),
  Natività (16 Hatur…vigilia del Natale).

## Regole incerte (in `src/lib/calendario/rules.ts`, configurabili da admin)
| id | Opzioni | Se disattivata |
|---|---|---|
| `natale` | `29-koiak`, `7-gennaio` | Natale non mostrato; digiuno fino al 28 Kiahk |
| `nasi6` | `contenuti-propri`, `come-5-nasi` | il 6 Nassi usa la chiave `13-06` |
| `concomitanze` | `mostra-entrambe`, `prevale-stagione-mobile` | festa fissa e Settimana Santa/Pasqua mostrate insieme |
| `mercolediVenerdi` | — | non implementata, non attivabile |
Gli id contengono i vecchi nomi (`koiak`, `nasi`) apposta: sono salvati nel DB.

## Dati e API
- Collezioni MongoDB: `calendario_contenuti`, `calendario_feste`,
  `calendario_regole`, `calendario_impostazioni` (+ voce `calendario` in `section_visibility`).
- Seed: `npm run seed-calendario` (legge `.env.local`; idempotente, non sovrascrive
  le modifiche dell'admin).
- API pubblica: `GET /api/calendario/giorno?fixed=&movable=&seasonal=` (solo contenuti pubblicati).
- API admin: `/api/admin/calendario/{contenuti,feste,regole,impostazioni}`.

## File principali
- Motore: `src/lib/calendario/` (jdn, coptic, months, easter, tz, sun, service, rules, content, resolver, lookup, year, today, params)
- DB: `src/lib/mongo/calendario.ts`, `src/lib/calendario-data.ts`
- UI pubblica: `src/app/(main)/calendario/page.tsx`, `src/app/(main)/calendario/feste/page.tsx`, `src/components/calendario/` (anche `CalendarioHomeCard`, `FesteAnno`)
- Visibilità lato browser: `src/components/useSectionAccess.ts`, `src/lib/section-access-client.ts`
- Confronto algoritmi (solo analisi): `scripts/confronto-algoritmi/`, `docs/confronto-algoritmi.md`
- UI admin: `src/app/admin/(dashboard)/calendario/page.tsx`, `src/components/admin/calendario/`
- Testi: `src/messages/it.json`, `src/messages/ar.json` (namespace `calendario` con `calendario.home` e `calendario.festeAnno`, `adminCalendario`; `nav.calendarioFeste`, `sidebar.subCalendarioFeste`, `topbar.calendarioFeste`)
  Attenzione: `calendario.feste` è una stringa ("Feste") usata da `DayCard`, non un namespace.

## Punti aperti
- Revisione delle traduzioni arabe e dei nomi italiani delle feste.
- Scrittura copta dei nomi dei mesi (campo `coptic` vuoto).
- Regole incerte da decidere: data del Natale, 6 Nassi, concomitanze, digiuno mercoledì/venerdì (da implementare).
- Natale come festa fissa: ancora TODO (28/29 Kiahk).
- Inserimento dei contenuti reali (Sinassario, letture) dal pannello admin.
- Il ruolo "prete" manca nei valori predefiniti di visibilità delle altre sezioni (problema preesistente).
- Dal confronto degli algoritmi (decisione aperta, vedi `docs/confronto-algoritmi.md`):
  Pasqua errata per anni astronomici negativi (`%` di JS, irraggiungibile dalla UI);
  opzione Natale `7-gennaio` che dal 2100 non coincide più col 29 Kiahk (`29-koiak` resta valida).
- Revisione dei testi arabi nuovi (`calendario.home`, `calendario.festeAnno`).
- Prossima fase prevista: letture del giorno basate sulle chiavi sopra.

## Regole per ogni prompt di modifica
- Lavorare su `feat/calendario-copto`, scrivere prima i test, commit separati con messaggi chiari; push/merge su `main` solo se richiesto.
- Non modificare né rimuovere funzionalità esistenti del sito; file condivisi (menu, router) toccati in modo minimo.
- Seguire stile e convenzioni della repo; testi utente in `it.json` e `ar.json`.
- Niente dati liturgici inventati: se un dato non è certo resta vuoto o diventa una regola con TODO.
- Non copiare testi delle letture nella repo e non leggere siti esterni a runtime.
- Non cambiare numeri dei mesi, chiavi dei giorni né id salvati nel DB; se servono migrazioni, proporle prima di eseguirle.
- Il calcolo delle date resta indipendente dal database.
- Alla fine: test, typecheck, lint, e aggiornare `docs/calendario.md` e questo file.
