from datetime import date, timedelta

COPTIC_EPOCH = 103605  # RD di 1 Thout 1 AM = 29 agosto 284 (giuliano)

def julian_to_rd(y, m, d):
    leap = (y % 4 == 0)
    corr = 0 if m <= 2 else (-1 if leap else -2)
    return -1 - 1 + 365*(y-1) + (y-1)//4 + (367*m - 362)//12 + corr + d

def rd_to_coptic(rd):
    y = (4*(rd - COPTIC_EPOCH) + 1463) // 1461
    start = COPTIC_EPOCH - 1 + 365*(y-1) + y//4 + 1
    m = (rd - start)//30 + 1
    d = rd - (start + 30*(m-1)) + 1
    return y, m, d

def easter_rd(y_greg):
    a, b, c = y_greg % 4, y_greg % 7, y_greg % 19
    dd = (19*c + 15) % 30
    e = (2*a + 4*b - dd + 34) % 7
    month, day = divmod(dd + e + 114, 31)
    return julian_to_rd(y_greg, month, day + 1)

def greg(rd): return date.fromordinal(rd)

MESI = ["Thout","Baba","Hator","Kiahk","Tobi","Amshir","Baramhat","Baramouda","Bashons","Paona","Abib","Mesra","Nasie"]
def show(rd):
    y,m,d = rd_to_coptic(rd); return f"{d} {MESI[m-1]} {y} AM"

for dt in [date(2026,1,7), date(2026,4,7), date(2026,9,11), date(2024,9,11), date(2023,9,12), date(2100,3,1)]:
    print(dt, "->", show(dt.toordinal()))
for yr in [2020,2021,2024,2025,2026,2027]:
    e = easter_rd(yr); print(yr, "Pasqua", greg(e), show(e), "| Quaresima", greg(e-55), "| Ninive", greg(e-69), "| Ascensione", greg(e+39), "| Pentecoste", greg(e+49))
