/**
 * Nomi dei mesi copti.
 *
 * `translit` è il nome visualizzato nell'interfaccia (traslitterazione in uso
 * nella comunità, non bohairica). Gli id dei mesi sono i numeri 1-13, su cui
 * si basano le chiavi dei giorni: cambiare i nomi non tocca i dati. I campi
 * `coptic` (scrittura copta) e `ar` (arabo) sono predisposti per mostrare
 * in seguito anche gli altri nomi senza riscrivere l'interfaccia:
 * `coptic` è lasciato vuoto finché non verrà fornita la grafia corretta.
 * I nomi arabi sono quelli di uso comune nella Chiesa copta (da far
 * rivedere a chi cura le traduzioni).
 */

export interface CopticMonthInfo {
  /** 1-13 */
  number: number;
  translit: string;
  coptic?: string;
  ar?: string;
}

export const COPTIC_MONTHS: readonly CopticMonthInfo[] = [
  { number: 1, translit: "Tut", ar: "توت" },
  { number: 2, translit: "Baba", ar: "بابه" },
  { number: 3, translit: "Hatur", ar: "هاتور" },
  { number: 4, translit: "Kiahk", ar: "كيهك" },
  { number: 5, translit: "Tuba", ar: "طوبة" },
  { number: 6, translit: "Hamshir", ar: "أمشير" },
  { number: 7, translit: "Baramhat", ar: "برمهات" },
  { number: 8, translit: "Baramoda", ar: "برمودة" },
  { number: 9, translit: "Bashans", ar: "بشنس" },
  { number: 10, translit: "Baona", ar: "بؤونة" },
  { number: 11, translit: "Abib", ar: "أبيب" },
  { number: 12, translit: "Mesra", ar: "مسرى" },
  { number: 13, translit: "Nassi", ar: "النسيء" },
];

export type MonthNameStyle = "translit" | "coptic" | "ar";

/** Nome del mese nello stile richiesto, con ripiego sulla traslitterazione. */
export function copticMonthName(month: number, style: MonthNameStyle = "translit"): string {
  const info = COPTIC_MONTHS[month - 1];
  if (!info) return "";
  return (style !== "translit" && info[style]) || info.translit;
}
