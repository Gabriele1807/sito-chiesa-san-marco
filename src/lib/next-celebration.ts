import type { OrarioSettimanale } from "@/types";

const GIORNI_IT = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface NextCelebration {
  giorno: string;
  tipo: string;
  orario: string;
  note?: string;
}

/**
 * Estrae l'orario di inizio da una stringa come "08:00 – 11:00" o "18:30"
 */
function parseStartTime(orario: string): { hours: number; minutes: number } | null {
  const match = orario.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
}

/**
 * Calcola la prossima celebrazione in base al giorno e orario corrente.
 */
export function getNextCelebration(
  orari: OrarioSettimanale[],
  now: Date = new Date()
): NextCelebration | null {
  if (!orari.length) return null;

  const currentDayIndex = now.getDay(); // 0=Domenica, 1=Lunedì, ...
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  // Mappa giorni italiani a indice JS (0=Domenica)
  const giornoToIndex: Record<string, number> = {};
  for (let i = 0; i < GIORNI_IT.length; i++) {
    giornoToIndex[GIORNI_IT[i]] = i;
  }

  // Cerca nelle prossime 7 giornate (partendo da oggi)
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (currentDayIndex + offset) % 7;
    const dayName = GIORNI_IT[dayIndex];

    const daySchedule = orari.find((o) => o.giorno === dayName);
    if (!daySchedule || !daySchedule.celebrazioni.length) continue;

    for (const cel of daySchedule.celebrazioni) {
      const startTime = parseStartTime(cel.orario);
      if (!startTime) continue;

      const celTimeInMinutes = startTime.hours * 60 + startTime.minutes;

      // Se è oggi, prendi solo celebrazioni future
      if (offset === 0 && celTimeInMinutes <= currentTimeInMinutes) {
        continue;
      }

      return {
        giorno: dayName,
        tipo: cel.tipo,
        orario: cel.orario,
        note: cel.note,
      };
    }
  }

  // Fallback: prima celebrazione della settimana
  for (const schedule of orari) {
    if (schedule.celebrazioni.length > 0) {
      return {
        giorno: schedule.giorno,
        tipo: schedule.celebrazioni[0].tipo,
        orario: schedule.celebrazioni[0].orario,
        note: schedule.celebrazioni[0].note,
      };
    }
  }

  return null;
}
