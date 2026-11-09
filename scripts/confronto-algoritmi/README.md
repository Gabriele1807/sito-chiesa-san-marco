# Confronto degli algoritmi del calendario copto

Strumento di analisi, **fuori** da build, test automatici e `package.json`.
Confronta il motore del sito (`src/lib/calendario`: `jdn.ts`, `coptic.ts`,
`easter.ts`, più `resolver.ts` per il Natale) con l'algoritmo alternativo
`calendario_copto.py` e con un riferimento indipendente. Rapporto:
[`docs/confronto-algoritmi.md`](../../docs/confronto-algoritmi.md).

| File | Ruolo |
|---|---|
| `calendario_copto.py` | Copia identica di `tmp/calendario_copto.py` (algoritmo da confrontare) |
| `esporta-sito.mjs` | Esegue il codice TypeScript del sito con Node (type stripping nativo, nessun pacchetto in più) ed esporta i risultati |
| `riferimento.py` | Riferimento indipendente: calendari "a contachilometri" da ancore storiche, tabella dei pleniluni pasquali, `dateutil` |
| `confronta.py` | Confronto e rapporto in Markdown; codice di uscita 1 se trova differenze |

## Uso

Dalla radice della repo:

```bash
pip install python-dateutil      # una volta sola, fuori dalla repo
python scripts/confronto-algoritmi/confronta.py                 # 1800-2500
python scripts/confronto-algoritmi/confronta.py --da 1 --a 9999  # tutto l'intervallo di datetime
python scripts/confronto-algoritmi/confronta.py --out rapporto.md --oggi 2026-11-09
```

Requisiti: Python 3.10+ con `python-dateutil`, Node 22.18+ (testato con Node 24).
Il file temporaneo dei risultati del sito viene scritto nella cartella
temporanea di sistema e cancellato alla fine.
