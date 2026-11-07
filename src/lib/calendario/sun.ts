/**
 * Tramonto calcolato in locale con l'algoritmo semplificato NOAA/Meeus
 * ("equazione dell'alba"), con una seconda iterazione per affinare la
 * posizione del Sole all'ora del tramonto. Precisione tipica: ±1-2 minuti
 * alle latitudini abitate. Nessuna dipendenza, nessuna rete.
 *
 * Longitudine positiva a Est, latitudine positiva a Nord.
 */

const RAD = Math.PI / 180;
const J2000 = 2451545;
const OBLIQUITY = 23.4397 * RAD;
/** Rifrazione atmosferica + semidiametro del disco solare. */
const SUNSET_ALTITUDE = -0.833 * RAD;

export type SunsetKind = "normal" | "polar-night" | "midnight-sun";

export interface SunsetResult {
  kind: SunsetKind;
  /** Istante del tramonto (ms Unix); assente se il Sole non tramonta o non sorge. */
  at?: number;
}

function solarPosition(julianDate: number) {
  const n = julianDate - J2000;
  const m = (((357.5291 + 0.98560028 * n) % 360) + 360) % 360;
  const mRad = m * RAD;
  const c = 1.9148 * Math.sin(mRad) + 0.02 * Math.sin(2 * mRad) + 0.0003 * Math.sin(3 * mRad);
  const lambda = ((m + c + 180 + 102.9372) % 360) * RAD;
  const declination = Math.asin(Math.sin(lambda) * Math.sin(OBLIQUITY));
  return { mRad, lambda, declination };
}

/** Mezzogiorno solare (passaggio al meridiano) del giorno `jdn`, come data giuliana. */
function transitJd(jdn: number, lon: number): number {
  const jStar = jdn - J2000 + 0.0008 - lon / 360;
  const { mRad, lambda } = solarPosition(J2000 + jStar);
  return J2000 + jStar + 0.0053 * Math.sin(mRad) - 0.0069 * Math.sin(2 * lambda);
}

function hourAngle(lat: number, declination: number): number | SunsetKind {
  const phi = lat * RAD;
  const cosH =
    (Math.sin(SUNSET_ALTITUDE) - Math.sin(phi) * Math.sin(declination)) /
    (Math.cos(phi) * Math.cos(declination));
  if (cosH < -1) return "midnight-sun";
  if (cosH > 1) return "polar-night";
  return Math.acos(cosH);
}

/** Tramonto del giorno civile `jdn` nella località (lat, lon). */
export function sunsetInstant(jdn: number, lat: number, lon: number): SunsetResult {
  const transit = transitJd(jdn, lon);
  // Prima stima con la declinazione a mezzogiorno, poi con quella al tramonto.
  let setJd = transit;
  for (let i = 0; i < 3; i++) {
    const h = hourAngle(lat, solarPosition(setJd).declination);
    if (typeof h === "string") return { kind: h };
    setJd = transit + h / (2 * Math.PI);
  }
  return { kind: "normal", at: Math.round((setJd - 2440587.5) * 86_400_000) };
}
