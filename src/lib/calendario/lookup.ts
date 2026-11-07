/**
 * Ricerca inversa: dato un livello e una chiave, un giorno (il primo
 * dall'anno copto indicato in poi) in cui quella chiave si applica. Serve
 * all'anteprima nel pannello admin. Al massimo qualche migliaio di giorni
 * risolti, tutti memoizzati.
 */

import { copticNewYearJdn, copticYearLength } from "./coptic";
import { resolveLiturgicalDay, type CalendarConfig, type LiturgicalDayInfo } from "./resolver";
import { contentKeysFor, type ContentLevel } from "./content";

export function findDayForKey(
  level: ContentLevel,
  key: string,
  config: CalendarConfig,
  fromCopticYear: number
): LiturgicalDayInfo | null {
  for (let year = fromCopticYear; year < fromCopticYear + 8; year++) {
    const first = copticNewYearJdn(year);
    for (let jdn = first; jdn < first + copticYearLength(year); jdn++) {
      const info = resolveLiturgicalDay(jdn, config);
      if (contentKeysFor(info, config)[level] === key) return info;
    }
  }
  return null;
}
