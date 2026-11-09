"""
Confronto fra il motore del calendario del sito (src/lib/calendario) e
l'algoritmo alternativo `calendario_copto.py`, con un riferimento
indipendente (`riferimento.py`, dateutil).

Solo analisi: non modifica nulla nella repo. Stampa un rapporto in Markdown
e termina con codice 1 se trova differenze fra gli algoritmi o rispetto al
riferimento.

Uso (dalla radice della repo):
    python scripts/confronto-algoritmi/confronta.py                # 1800-2500
    python scripts/confronto-algoritmi/confronta.py --da 1 --a 9999
    python scripts/confronto-algoritmi/confronta.py --out rapporto.md

Requisiti: Python 3.10+, python-dateutil, Node 22.18+ (nessun pacchetto npm in più).
"""

import argparse
import contextlib
import io
import os
import runpy
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.dont_write_bytecode = True  # niente __pycache__ nella repo
sys.path.insert(0, HERE)
import riferimento as ref  # noqa: E402

RD_TO_JDN = ref.RD_TO_JDN
MESI = ["Tut", "Baba", "Hatur", "Kiahk", "Tuba", "Hamshir", "Baramhat", "Baramoda",
        "Bashans", "Baona", "Abib", "Mesra", "Nassi"]

MESI_GREG = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]

# Campione noto (fornito dall'utente): data gregoriana -> data copta
CAMPIONE = [
    (date(2024, 9, 11), (1741, 1, 1)),
    (date(2025, 1, 5), (1741, 4, 27)),
    (date(2025, 1, 7), (1741, 4, 29)),
    (date(2025, 6, 28), (1741, 10, 21)),
]
CAMPIONE_PASQUA = [(2024, date(2024, 5, 5))]

# Date che dipendono dalla Pasqua (offset in giorni, come in src/lib/calendario/rules.ts)
DERIVATE = [
    ("Ninive (inizio)", -69), ("Ninive (fine)", -67), ("Inizio Quaresima", -55),
    ("Palme", -7), ("Pasqua", 0), ("Ascensione", 39), ("Pentecoste", 49),
]


def fmt_c(c):
    y, m, d = c
    return f"{d} {MESI[m - 1]} {y}"


def fmt_rd(rd):
    try:
        return date.fromordinal(rd).isoformat()
    except (ValueError, OverflowError):
        return f"RD {rd}"


def carica_python():
    with contextlib.redirect_stdout(io.StringIO()):
        return runpy.run_path(os.path.join(HERE, "calendario_copto.py"))


def esporta_sito(da, a):
    fd, path = tempfile.mkstemp(prefix="confronto-sito-", suffix=".txt")
    os.close(fd)
    script = os.path.join(HERE, "esporta-sito.mjs")
    subprocess.run(["node", "--no-warnings", script, path, str(da), str(a)], check=True)
    days, easter, natale, extra = {}, {}, {}, {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            p = line.split()
            if not p:
                continue
            if p[0] == "D":
                jdn, y, m, d, ok = map(int, p[1:])
                days[jdn - RD_TO_JDN] = ((y, m, d), ok == 1)
            elif p[0] == "E":
                easter[int(p[1])] = int(p[2]) - RD_TO_JDN
            elif p[0] == "N":
                cy, k29, n29, n7 = p[1:]
                natale[int(cy)] = tuple(None if v == "null" else int(v) - RD_TO_JDN for v in (k29, n29, n7))
            elif p[0] == "X":
                extra[int(p[1])] = int(p[2]) - RD_TO_JDN
    os.remove(path)
    return days, easter, natale, extra


def durata(da, a):
    """'X anni e Y giorni' da `da` ad `a` (date)."""
    anni = a.year - da.year - ((a.month, a.day) < (da.month, da.day))
    try:
        ultimo = da.replace(year=da.year + anni)
    except ValueError:  # 29 febbraio
        ultimo = date(da.year + anni, 3, 1)
    return f"{anni} anni e {(a - ultimo).days} giorni"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--da", type=int, default=1800)
    ap.add_argument("--a", type=int, default=2500)
    ap.add_argument("--oggi", default="2026-11-09")
    ap.add_argument("--out")
    args = ap.parse_args()
    da, a = args.da, args.a
    oggi = date.fromisoformat(args.oggi)
    if not (1 <= da <= a <= 9999):
        ap.error("intervallo ammesso: 1-9999 (limite di datetime.date)")

    out = []
    w = out.append
    problemi = 0

    py = carica_python()
    days, easter_sito, natale, extra = esporta_sito(da, a)
    rd_from, rd_to = date(da, 1, 1).toordinal(), date(a, 12, 31).toordinal()
    copto_ref = ref.coptic_odometer(rd_from, rd_to)

    w(f"# Confronto algoritmi — intervallo {da}-{a}\n")
    w(f"Giorni confrontati: {rd_to - rd_from + 1:,} ({fmt_rd(rd_from)} – {fmt_rd(rd_to)}). "
      f"Anni di Pasqua: {a - da + 1}.\n")

    # --- Epoca ---------------------------------------------------------------
    epoca_ref = ref.coptic_epoch_rd()
    w("## Epoca\n")
    w("| Fonte | 1 Tut 1 A.M. |\n|---|---|")
    w(f"| Python (`COPTIC_EPOCH`) | RD {py['COPTIC_EPOCH']} = JDN {py['COPTIC_EPOCH'] + RD_TO_JDN} |")
    w("| Sito (`COPTIC_EPOCH_JDN`) | JDN 1825030 = RD 103605 |")
    w(f"| Riferimento (a ritroso da 1 Tut 1741) | RD {epoca_ref} = JDN {epoca_ref + RD_TO_JDN} = "
      f"{'%d/%d/%d' % tuple(reversed(ref.julian_date_of_rd(epoca_ref)))} giuliano |\n")
    if not (epoca_ref == py["COPTIC_EPOCH"] == 1825030 - RD_TO_JDN):
        problemi += 1
        w("**Epoche diverse.**\n")

    # --- Giorno per giorno -----------------------------------------------------
    diff = {"sito/python": [], "sito/riferimento": [], "python/riferimento": []}
    rt_ko = []
    for rd in range(rd_from, rd_to + 1):
        s, ok = days[rd]
        p = py["rd_to_coptic"](rd)
        r = copto_ref.date_of(rd)
        if not ok:
            rt_ko.append(rd)
        if s != p:
            diff["sito/python"].append((rd, s, p))
        if s != r:
            diff["sito/riferimento"].append((rd, s, r))
        if p != r:
            diff["python/riferimento"].append((rd, p, r))

    w("## Gregoriano → copto, giorno per giorno\n")
    w("| Coppia | Differenze | Prima data diversa |\n|---|---|---|")
    for k, v in diff.items():
        prima = f"{fmt_rd(v[0][0])}: {fmt_c(v[0][1])} vs {fmt_c(v[0][2])}" if v else "nessuna"
        w(f"| {k} | {len(v)} | {prima} |")
        problemi += bool(v)
    w(f"\nAndata e ritorno del sito (`jdnToCoptic` → `copticToJdn`): {len(rt_ko)} errori. "
      "Il file Python non ha la conversione copto → giorno: per Python vale il confronto col riferimento.\n")
    problemi += bool(rt_ko)

    # --- Capodanno copto -------------------------------------------------------
    w("## Capodanno copto (1 Tut) per secolo\n")
    per_secolo = defaultdict(Counter)
    nayrouz = {}
    for rd in range(rd_from, rd_to + 1):
        (y, m, d), _ = days[rd]
        if m == 1 and d == 1:
            g = date.fromordinal(rd)
            nayrouz[g.year] = (g, y)
            per_secolo[g.year // 100 * 100][f"{g.day} {MESI_GREG[g.month - 1]}"] += 1
    w("| Anni | Giorni del Capodanno (numero di anni) |\n|---|---|")
    for sec in sorted(per_secolo):
        w(f"| {sec}-{sec + 99} | " + ", ".join(f"{k}: {n}" for k, n in sorted(per_secolo[sec].items(), key=lambda kv: (MESI_GREG.index(kv[0].split()[1]), int(kv[0].split()[0])))) + " |")
    w("")
    for anno in (2099, 2100, 2101, 2102, 2103):
        if anno in nayrouz:
            g, cy = nayrouz[anno]
            w(f"- {anno}: 1 Tut {cy} = {g.day}/{g.month}/{g.year}")
    w("")

    # --- Confini di secolo --------------------------------------------------------
    w("## Confini di secolo (28 febbraio – 1 marzo)\n")
    w("| Data | Esiste? | Giuliano | Sito | Python | Riferimento |\n|---|---|---|---|---|---|")
    for anno in range((da + 99) // 100 * 100, a + 1, 100):
        for m, d in ((2, 28), (2, 29), (3, 1)):
            try:
                g = date(anno, m, d)
            except ValueError:
                w(f"| {d}/{m}/{anno} | no (non bisestile) | — | — | — | — |")
                continue
            rd = g.toordinal()
            jy, jm, jd = ref.julian_date_of_rd(rd)
            w(f"| {d}/{m}/{anno} | sì | {jd}/{jm}/{jy} | {fmt_c(days[rd][0])} | "
              f"{fmt_c(py['rd_to_coptic'](rd))} | {fmt_c(copto_ref.date_of(rd))} |")
    w("")

    # --- Nassi --------------------------------------------------------------------
    nassi = Counter()
    for rd in range(rd_from, rd_to + 1):
        (y, m, d), _ = days[rd]
        if m == 13:
            nassi[y] += 1
    anni_completi = [y for y in nassi if days[rd_from][0][0] < y < days[rd_to][0][0]]
    errati = [y for y in anni_completi if nassi[y] != (6 if ref.coptic_is_leap(y) else 5)]
    bis = sum(1 for y in anni_completi if nassi[y] == 6)
    w("## Mese di Nassi\n")
    w(f"Anni copti completi nell'intervallo: {len(anni_completi)}; Nassi di 6 giorni: {bis}; "
      f"di 5 giorni: {len(anni_completi) - bis}; lunghezze errate rispetto a (anno+1) mod 4 = 0: {len(errati)}.\n")
    problemi += bool(errati)

    # --- Pasqua ---------------------------------------------------------------------
    julian = ref.julian_odometer(date(da, 1, 1).toordinal() - 400, rd_to)
    righe, n_du = [], 0
    for y in range(da, a + 1):
        s = easter_sito[y]
        p = py["easter_rd"](y)
        t = ref.easter_table_rd(y, julian)
        du = ref.easter_dateutil_rd(y)
        n_du += du is not None
        if len({s, p, t} | ({du} if du is not None else set())) > 1:
            righe.append((y, s, p, t, du))
    w("## Pasqua copta, anno per anno\n")
    w(f"Fonti: sito (`copticEasterJdn`), Python (`easter_rd`), tabella dei pleniluni giuliani, "
      f"dateutil EASTER_ORTHODOX ({n_du} anni nel suo intervallo 1583-4099).\n")
    if righe:
        problemi += 1
        w("| Anno | Sito | Python | Tabella | dateutil | Scarto sito-Python (giorni) |\n|---|---|---|---|---|---|")
        for y, s, p, t, du in righe:
            w(f"| {y} | {fmt_rd(s)} | {fmt_rd(p)} | {fmt_rd(t)} | {fmt_rd(du) if du else '—'} | {s - p} |")
    else:
        w("**Nessuna differenza**: le quattro fonti danno la stessa data per ogni anno.\n")

    diff_der = sum(1 for y in range(da, a + 1) for _, off in DERIVATE
                   if easter_sito[y] + off != py["easter_rd"](y) + off)
    w(f"Date derivate (Ninive, inizio Quaresima, Palme, Ascensione, Pentecoste): {diff_der} differenze.\n")
    campione_anni = [y for y in (2024, 2025, 2026, 2027, 2100, 2500) if da <= y <= a]
    if campione_anni:
        w("| Anno | " + " | ".join(n for n, _ in DERIVATE) + " |\n|---|" + "---|" * len(DERIVATE))
        for y in campione_anni:
            w(f"| {y} | " + " | ".join(fmt_rd(easter_sito[y] + off) for _, off in DERIVATE) + " |")
        w("")
    if extra:
        w("Anni ≤ 0 (fuori dalla UI, solo informativo): " + ", ".join(
            f"{y}: sito RD {extra[y]}, Python RD {py['easter_rd'](y)}"
            f"{' (diverso, ' + str(extra[y] - py['easter_rd'](y)) + ' g)' if extra[y] != py['easter_rd'](y) else ''}"
            for y in sorted(extra)) + ".\n")

    # --- Campione noto ------------------------------------------------------------------
    w("## Campione di date note\n")
    w("| Data | Attesa | Sito | Python | Riferimento |\n|---|---|---|---|---|")
    for g, atteso in CAMPIONE:
        rd = g.toordinal()
        if not rd_from <= rd <= rd_to:
            continue
        valori = [days[rd][0], py["rd_to_coptic"](rd), copto_ref.date_of(rd)]
        problemi += any(v != atteso for v in valori)
        w(f"| {g.isoformat()} | {fmt_c(atteso)} | " + " | ".join(fmt_c(v) for v in valori) + " |")
    for y, atteso in CAMPIONE_PASQUA:
        if da <= y <= a:
            valori = [easter_sito[y], py["easter_rd"](y), ref.easter_table_rd(y, julian)]
            problemi += any(v != atteso.toordinal() for v in valori)
            w(f"| Pasqua {y} | {atteso.isoformat()} | " + " | ".join(fmt_rd(v) for v in valori) + " |")
    w("")

    # --- Natale (regola incerta) --------------------------------------------------------
    w("## Natale: le due opzioni della regola `natale` nel risolutore\n")
    stat = defaultdict(lambda: {"k29": Counter(), "7gen": Counter(), "7gen_non_k29": 0, "n": 0})
    primo_9 = None
    for cy, (k29, n29, n7) in sorted(natale.items()):
        if not rd_from <= k29 <= rd_to:
            continue
        g = date.fromordinal(k29)
        st = stat[g.year // 100 * 100]
        st["n"] += 1
        st["k29"][f"{g.day}/{g.month}"] += 1
        g7 = date.fromordinal(n7)
        st["7gen"][f"{g7.day}/{g7.month}"] += 1
        st["7gen_non_k29"] += n7 != k29
        problemi += n29 != k29  # "29-koiak" deve essere sempre il 29 Kiahk
        if g7.day != 7 and primo_9 is None:
            primo_9 = (cy, g7)
    w("| Anni (data del 29 Kiahk) | 29 Kiahk cade il | \"7-gennaio\" dà | \"7-gennaio\" ≠ 29 Kiahk |\n|---|---|---|---|")
    for sec in sorted(stat):
        st = stat[sec]
        w(f"| {sec}-{sec + 99} | " + ", ".join(f"{k}: {n}" for k, n in sorted(st["k29"].items())) + " | "
          + ", ".join(f"{k}: {n}" for k, n in sorted(st["7gen"].items())) + f" | {st['7gen_non_k29']} su {st['n']} |")
    if primo_9:
        w(f"\nPrimo anno in cui \"7-gennaio\" non dà il 7 gennaio: {primo_9[0]} A.M. → "
          f"{primo_9[1].day}/{primo_9[1].month}/{primo_9[1].year}.")
    w("")

    # --- Distanze da oggi ---------------------------------------------------------------
    w(f"## Da oggi ({oggi.day}/{oggi.month}/{oggi.year})\n")
    for nome, g in (("1 marzo 2100 (primo giorno con scarto giuliano 14)", date(2100, 3, 1)),
                    ("12 settembre 2100 (primo Capodanno al 12 in un anno normale)", date(2100, 9, 12))):
        w(f"- {nome}: tra {durata(oggi, g)} ({(g - oggi).days} giorni).")
    w("")

    w(f"## Esito\n\n{'OK: nessuna differenza.' if not problemi else f'{problemi} problemi trovati.'}")
    testo = "\n".join(out) + "\n"
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(testo)
    sys.stdout.reconfigure(encoding="utf-8")
    print(testo)
    return 1 if problemi else 0


if __name__ == "__main__":
    sys.exit(main())
