# Confronto degli algoritmi: motore del sito e `calendario_copto.py`

Data dell'analisi: 9 novembre 2026, `feat/calendario-copto` @ `374ae25`.
Solo analisi: il motore del sito **non** è stato modificato.
Script ripetibile: `python scripts/confronto-algoritmi/confronta.py` (vedi il
[README](../scripts/confronto-algoritmi/README.md)).

## In breve

- **Nessuna differenza** fra i due algoritmi, né fra ciascuno e il riferimento
  indipendente, su **3.652.059 giorni (1/1/1 – 31/12/9999)** e sulla Pasqua di
  **ogni anno da 1 a 9999**. Quindi non esiste una "prima data in cui danno
  risultati diversi" e non c'è nessun giorno di scarto in arrivo.
- Il motivo: sono la **stessa matematica** con origini diverse. La conversione
  copta è in entrambi la formula di *Calendrical Calculations* (Reingold e
  Dershowitz) e la Pasqua è in entrambi il computo giuliano di Meeus. Python
  conta i giorni in RD (1/1/1 gregoriano = 1), il sito in JDN: JDN = RD + 1721425.
- Il cambiamento del **2100** non è una differenza fra algoritmi: dal 1° marzo 2100
  lo scarto giuliano/gregoriano passa da 13 a 14 giorni e **tutti e due** spostano
  il Capodanno copto al 12 settembre (13 nell'anno prima di un bisestile).
- Raccomandazione: **tenere il motore attuale**. Due limiti da decidere, sotto:
  Pasqua per anni ≤ 0 (irraggiungibile dalla UI) e opzione Natale `7-gennaio` fuori dal 1900-2099.

## Metodo

| Fonte | Cosa |
|---|---|
| Sito | `jdnToCoptic`, `copticToJdn`, `copticEasterJdn` eseguiti così come sono (Node, senza ricompilare né copiare il codice) |
| Python | `rd_to_coptic`, `easter_rd` di `calendario_copto.py` (copia identica) |
| Riferimento indipendente | Nessuna formula chiusa: gregoriano con `datetime.date`; giuliano e copto "a contachilometri", un giorno alla volta con le sole lunghezze dei mesi, da ancore storiche (15/10/1582 gregoriano = 5/10/1582 giuliano; 11/9/2024 = 1 Tut 1741) |
| Pasqua, riferimento | `dateutil.easter` con `EASTER_ORTHODOX` (1583-4099) e tabella tradizionale dei 19 pleniluni pasquali giuliani (prima domenica dopo) |

Verifiche: data copta giorno per giorno; andata e ritorno; Capodanno anno per
anno; 28 febbraio – 1° marzo di ogni anno secolare; lunghezza di Nassi per ogni
anno; Pasqua e date derivate per ogni anno; campione di date note; le due opzioni
della regola `natale` nel risolutore.

## Risultati (1800-2500 e 1-9999)

| Verifica | 1800-2500 | 1-9999 |
|---|---|---|
| Giorni confrontati | 256.035 | 3.652.059 |
| Differenze sito/Python, sito/riferimento, Python/riferimento | 0 / 0 / 0 | 0 / 0 / 0 |
| Errori di andata e ritorno del sito | 0 | 0 |
| Anni di Nassi con lunghezza errata (6 giorni sse (anno+1) mod 4 = 0) | 0 su 700 | 0 su 9998 |
| Anni di Pasqua con differenze (sito, Python, tabella, dateutil) | 0 su 701 | 0 su 9999 (dateutil su 2517) |
| Differenze in Ninive, inizio Quaresima, Palme, Ascensione, Pentecoste | 0 | 0 |

**Tabella delle differenze: vuota** in tutto l'intervallo analizzato.

### Epoca

| Fonte | 1 Tut 1 A.M. |
|---|---|
| Python | RD 103605 = JDN 1825030 |
| Sito | JDN 1825030 = RD 103605 |
| Riferimento (a ritroso da 1 Tut 1741) | RD 103605 = 29 agosto 284 giuliano |

Le due epoche sono lo stesso giorno (JDN 2451545 = 1/1/2000 = RD 730120 conferma lo scarto 1721425).

### Campione di date note

| Data | Atteso | Sito | Python | Riferimento |
|---|---|---|---|---|
| 11/9/2024 | 1 Tut 1741 | ✓ | ✓ | ✓ |
| 5/1/2025 | 27 Kiahk 1741 | ✓ | ✓ | ✓ |
| 7/1/2025 | 29 Kiahk 1741 | ✓ | ✓ | ✓ |
| 28/6/2025 | 21 Baona 1741 | ✓ | ✓ | ✓ |
| Pasqua 2024 | 5 maggio | ✓ | ✓ | ✓ |

Oggi, 9/11/2026, è il 30 Baba 1743 (anno bisestile: Nassi avrà 6 giorni).

### Pasqua e date derivate (campione)

| Anno | Ninive | Inizio Quaresima | Palme | Pasqua | Ascensione | Pentecoste |
|---|---|---|---|---|---|---|
| 2024 | 26-28 feb | 11 mar | 28 apr | 5 mag | 13 giu | 23 giu |
| 2025 | 10-12 feb | 24 feb | 13 apr | 20 apr | 29 mag | 8 giu |
| 2026 | 2-4 feb | 16 feb | 5 apr | 12 apr | 21 mag | 31 mag |
| 2027 | 22-24 feb | 8 mar | 25 apr | 2 mag | 10 giu | 20 giu |
| 2100 | 22-24 feb | 8 mar | 25 apr | 2 mag | 10 giu | 20 giu |

### Confini di secolo e Capodanno

| Data | Giuliano | Sito = Python = riferimento |
|---|---|---|
| 28/2/2100 | 15/2/2100 | 20 Hamshir 1816 |
| 29/2/2100 | non esiste (2100 non è bisestile gregoriano; lo è nel giuliano) | — |
| 1/3/2100 | 16/2/2100 | 21 Hamshir 1816 |

Lo stesso vale per 1800, 1900, 2200, 2300 e 2500 (tutti uguali nelle tre fonti;
tabella completa nell'uscita dello script).

| Anni | Capodanno copto (1 Tut) |
|---|---|
| 1800-1899 | 10 settembre (75 anni), 11 (25) |
| 1900-2099 | 11 settembre (75 anni per secolo), 12 (25) |
| 2100-2199 | 12 settembre (75), 13 (25) |
| 2200-2299 | 13 settembre (75), 14 (25) |

Dal 2099 al 2103: 12/9/2099 (1816, dopo un Nassi di 6 giorni), 12/9/2100,
12/9/2101, 12/9/2102, 13/9/2103. L'11/9/2100 è il 5 Nassi 1816.

**Da oggi** (9/11/2026): il primo giorno con scarto di 14 giorni (1/3/2100) è fra
73 anni e 112 giorni; il primo Capodanno al 12 settembre in un anno "normale"
(12/9/2100) fra 73 anni e 307 giorni. In entrambi i casi i due algoritmi restano identici.

## Limiti di ciascun algoritmo

| | Sito | Python |
|---|---|---|
| Intervallo | Qualsiasi JDN per le conversioni (usa `fdiv`/`mod` corretti anche per i negativi) | Le formule valgono per qualsiasi RD, ma `date.fromordinal` limita la visualizzazione agli anni 1-9999 |
| Anni giuliani | Anni astronomici (0 = 1 a.C.) | Idem |
| Pasqua, anni ≤ 0 | **Errata per anni negativi**: `year % 4` di JavaScript è negativo (es. anno −1: RD −652 invece di −623, 29 giorni prima). Anno 0 corretto | Corretta (il `%` di Python è sempre ≥ 0; confermato dalla tabella dei pleniluni) |
| Conversione copto → giorno | `copticToJdn`, verificata in andata e ritorno | Assente: il file ha solo giorno → copto |
| Ipotesi | Pasqua solo come computo giuliano (corretto per la Chiesa copta), nessuna tabella | Idem; inoltre richiede l'anno gregoriano della Pasqua (il sito ha anche `easterJdnForCopticYear`) |

## Segnalazioni (non corrette, decisione tua)

### 1. Pasqua per anni astronomici negativi

- Dove: `src/lib/calendario/easter.ts`, `copticEasterJdn` (`year % 4`, `% 7`, `% 19`).
- Effetto: anni ≤ −1 (prima dell'1 a.C.). La UI non ci arriva (il campo data ha
  `min="0001-01-01"`; il primo anno copto raggiungibile, −283, chiede la Pasqua
  dell'anno 1), quindi **nessun effetto pratico oggi**.
- Valore corretto, esempio: anno −1 → 20 aprile giuliano (RD −623, JDN 1720802); il sito dà RD −652.
- Test proposto (oggi fallisce):

  ```ts
  it("Pasqua corretta anche per anni astronomici negativi", () => {
    expect(copticEasterJdn(-1)).toBe(julianToJdn(-1, 4, 20));
    expect(copticEasterJdn(-5)).toBe(julianToJdn(-5, 4, 4));
  });
  ```

- Correzione possibile: usare `mod()` di `jdn.ts` al posto di `%`.

### 2. Opzione `7-gennaio` della regola `natale` fuori dal 1900-2099

Il risolutore (`nativityJdn` in `resolver.ts`) sposta il Natale al giorno prima
solo quando il 29 Kiahk cade l'**8** gennaio.

- Fino al 2099 le due opzioni differiscono solo un anno su quattro (29 Kiahk l'8 gennaio).
- **Dal 2100 l'opzione `7-gennaio` non coincide più col 29 Kiahk**: con lo scarto
  di 14 giorni il 29 Kiahk cade l'8 gennaio (3 anni su 4) o il 9 (1 su 4). Con
  `7-gennaio` il Natale cade quindi ogni anno sul 28 Kiahk (7 gennaio) dal Natale
  1817 A.M. (7/1/2101), tranne gli anni col 29 Kiahk al 9 gennaio, dove resta il
  9 gennaio (primo caso: 1820 A.M., 9/1/2104): né "sempre il 7 gennaio" né "sempre il 29 Kiahk".
  Nel 2100-2199: 76 anni su 100 diversi dal 29 Kiahk, 24 non il 7 gennaio.
- **`29-koiak` resta valida** in ogni anno (sempre il 29 Kiahk, verificato su 1-9999).
- Prima del 1900 succede l'analogo al contrario (29 Kiahk il 6 o 7 gennaio).
- Test proposto, da adattare a ciò che il clero deciderà che `7-gennaio` significhi:

  ```ts
  it("con '7-gennaio' il Natale cade il 7 gennaio anche dopo il 2100", () => {
    const config = { ...DEFAULT_CONFIG, rules: { natale: { enabled: true, value: "7-gennaio" } } };
    const jan7 = gregorianToJdn(2104, 1, 7);
    expect(resolveLiturgicalDay(jan7, config).feasts.map((f) => f.id)).toContain("natale"); // oggi: 9/1/2104
  });
  ```

## Raccomandazione

Tenere il motore del sito così com'è: dà gli stessi risultati di
`calendario_copto.py` in ogni giorno e anno verificabile, coincide con un
riferimento costruito in modo indipendente e con `dateutil`, ha in più la
conversione inversa e i test, e lavora per numeri di giorno senza dipendere da
`datetime`. Sostituirlo non porterebbe nessun cambiamento nei risultati.
Le due segnalazioni sopra riguardano solo anni lontani; le correzioni proposte
sono piccole e vanno decise insieme alla regola del Natale.
