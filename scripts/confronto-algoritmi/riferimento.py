"""
Riferimento indipendente per il confronto degli algoritmi.

Non usa nessuna delle formule chiuse dei due algoritmi confrontati
(Calendrical Calculations / Fliegel-Van Flandern / Meeus). Ogni calendario
è un "contachilometri": si parte da un'ancora storica e si avanza o si
arretra di un giorno alla volta usando solo le lunghezze dei mesi.

- Gregoriano: `datetime.date` di Python (prolettico, anni 1-9999).
  Numero di giorno = RD (`date.toordinal()`, 1 gennaio 1 = 1).
- Giuliano: ancora 15 ottobre 1582 gregoriano = 5 ottobre 1582 giuliano
  (riforma gregoriana); febbraio di 29 giorni negli anni divisibili per 4.
- Copto: ancora 11 settembre 2024 = 1 Tut 1741 (campione noto); 12 mesi di
  30 giorni + Nassi di 5 giorni, 6 quando (anno + 1) è divisibile per 4.
- Pasqua: (1) `dateutil.easter` con EASTER_ORTHODOX (1583-4099);
  (2) tabella tradizionale dei 19 pleniluni pasquali giuliani per numero
  d'oro, Pasqua = prima domenica strettamente successiva.

JDN = RD + 1721425 (verificato: JDN 2451545 = 1 gennaio 2000 = RD 730120).
"""

from array import array
from datetime import date

RD_TO_JDN = 1721425

# --- Giuliano -----------------------------------------------------------------

def _julian_month_len(y, m):
    if m == 2:
        return 29 if y % 4 == 0 else 28
    return 30 if m in (4, 6, 9, 11) else 31


def _julian_next(y, m, d):
    if d < _julian_month_len(y, m):
        return y, m, d + 1
    if m < 12:
        return y, m + 1, 1
    return y + 1, 1, 1


def _julian_prev(y, m, d):
    if d > 1:
        return y, m, d - 1
    if m > 1:
        return y, m - 1, _julian_month_len(y, m - 1)
    return y - 1, 12, 31


# --- Copto ----------------------------------------------------------------------

def coptic_is_leap(y):
    return (y + 1) % 4 == 0


def _coptic_month_len(y, m):
    if m < 13:
        return 30
    return 6 if coptic_is_leap(y) else 5


def _coptic_next(y, m, d):
    if d < _coptic_month_len(y, m):
        return y, m, d + 1
    if m < 13:
        return y, m + 1, 1
    return y + 1, 1, 1


def _coptic_prev(y, m, d):
    if d > 1:
        return y, m, d - 1
    if m > 1:
        return y, m - 1, _coptic_month_len(y, m - 1)
    return y - 1, 13, _coptic_month_len(y - 1, 13)


def encode(y, m, d):
    return y * 10000 + m * 100 + d


def decode(v):
    y, md = divmod(v, 10000)
    return y, md // 100, md % 100


class Odometer:
    """Tabella RD -> data, costruita passo passo da un'ancora.

    Le date sono codificate come interi (anno*10000 + mese*100 + giorno) in un
    `array` compatto; l'indice inverso (data -> RD) è limitato ai mesi
    richiesti, per stare in memoria anche sull'intervallo 1-9999.
    """

    def __init__(self, anchor_rd, anchor_ymd, step_next, step_prev, rd_from, rd_to, index_months=()):
        self.rd_from = rd_from
        self.table = array("q", bytes(8 * (rd_to - rd_from + 1)))
        cur = anchor_ymd
        for rd in range(anchor_rd, rd_to + 1):
            if rd >= rd_from:
                self.table[rd - rd_from] = encode(*cur)
            cur = step_next(*cur)
        cur = anchor_ymd
        for rd in range(anchor_rd, rd_from - 1, -1):
            if rd <= rd_to:
                self.table[rd - rd_from] = encode(*cur)
            cur = step_prev(*cur)
        self.index = {}
        if index_months:
            for i, v in enumerate(self.table):
                if (v % 10000) // 100 in index_months:
                    self.index[v] = rd_from + i

    def date_of(self, rd):
        return decode(self.table[rd - self.rd_from])

    def rd_of(self, y, m, d):
        return self.index[encode(y, m, d)]


def walk_to(anchor_rd, anchor_ymd, step_prev, target_ymd):
    """RD di `target_ymd` arretrando giorno per giorno dall'ancora."""
    rd, cur = anchor_rd, anchor_ymd
    while cur != target_ymd:
        cur = step_prev(*cur)
        rd -= 1
    return rd


JULIAN_ANCHOR = (date(1582, 10, 15).toordinal(), (1582, 10, 5))
COPTIC_ANCHOR = (date(2024, 9, 11).toordinal(), (1741, 1, 1))


def julian_odometer(rd_from, rd_to):
    # Indice solo su marzo-aprile: basta per i pleniluni pasquali.
    return Odometer(*JULIAN_ANCHOR, _julian_next, _julian_prev, rd_from, rd_to, index_months=(3, 4))


def coptic_odometer(rd_from, rd_to):
    return Odometer(*COPTIC_ANCHOR, _coptic_next, _coptic_prev, rd_from, rd_to)


def coptic_epoch_rd():
    """RD del 1 Tut 1 A.M., arretrando dall'ancora 1 Tut 1741."""
    return walk_to(*COPTIC_ANCHOR, _coptic_prev, (1, 1, 1))


def julian_date_of_rd(rd):
    """Data giuliana di un RD, arretrando (o avanzando) dall'ancora del 1582."""
    anchor_rd, cur = JULIAN_ANCHOR
    step = _julian_prev if rd < anchor_rd else _julian_next
    delta = -1 if rd < anchor_rd else 1
    while anchor_rd != rd:
        cur = step(*cur)
        anchor_rd += delta
    return cur


# --- Pasqua ---------------------------------------------------------------------

# Pleniluni pasquali giuliani per numero d'oro 1..19 (computo alessandrino).
PASCHAL_FULL_MOON = [
    (4, 5), (3, 25), (4, 13), (4, 2), (3, 22), (4, 10), (3, 30), (4, 18), (4, 7), (3, 27),
    (4, 15), (4, 4), (3, 24), (4, 12), (4, 1), (3, 21), (4, 9), (3, 29), (4, 17),
]


def easter_table_rd(year, julian):
    """RD della Pasqua copta/ortodossa con la tabella dei pleniluni (giuliano)."""
    m, d = PASCHAL_FULL_MOON[year % 19]
    rd = julian.rd_of(year, m, d) + 1
    while date.fromordinal(rd).weekday() != 6:  # 6 = domenica
        rd += 1
    return rd


def easter_dateutil_rd(year):
    """RD da dateutil (EASTER_ORTHODOX, valido 1583-4099), None fuori intervallo."""
    from dateutil.easter import easter, EASTER_ORTHODOX

    if not 1583 <= year <= 4099:
        return None
    return easter(year, EASTER_ORTHODOX).toordinal()
