/**
 * Data copta del giorno civile del dispositivo (da mezzanotte a mezzanotte).
 *
 * Funzioni pure, senza database né rete: servono ai collegamenti al
 * calendario (card della home, elenco delle feste) che mostrano "oggi"
 * senza dipendere dal tramonto o dalla località.
 */

import { jdnToGregorian, type YMD } from "./jdn";
import { jdnToCoptic, type CopticDate } from "./coptic";
import { localJdn, startOfDayInstant } from "./tz";

export interface CopticToday {
  jdn: number;
  coptic: CopticDate;
  gregorian: YMD;
}

export function copticToday(instant: number, timeZone: string): CopticToday {
  const jdn = localJdn(instant, timeZone);
  return { jdn, coptic: jdnToCoptic(jdn), gregorian: jdnToGregorian(jdn) };
}

/** Istante della prossima mezzanotte locale (cambio del giorno civile). */
export function nextLocalMidnight(instant: number, timeZone: string): number {
  return startOfDayInstant(localJdn(instant, timeZone) + 1, timeZone);
}
