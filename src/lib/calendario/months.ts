/**
 * Nomi dei mesi copti.
 *
 * `translit` è la traslitterazione bohairica usata nel sito. I campi
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
  { number: 1, translit: "Thout", ar: "توت" },
  { number: 2, translit: "Paope", ar: "بابه" },
  { number: 3, translit: "Hathor", ar: "هاتور" },
  { number: 4, translit: "Koiak", ar: "كيهك" },
  { number: 5, translit: "Tobi", ar: "طوبة" },
  { number: 6, translit: "Meshir", ar: "أمشير" },
  { number: 7, translit: "Paremhat", ar: "برمهات" },
  { number: 8, translit: "Paremoude", ar: "برمودة" },
  { number: 9, translit: "Pashons", ar: "بشنس" },
  { number: 10, translit: "Paoni", ar: "بؤونة" },
  { number: 11, translit: "Epip", ar: "أبيب" },
  { number: 12, translit: "Mesori", ar: "مسرى" },
  { number: 13, translit: "Nasi", ar: "النسيء" },
];

export type MonthNameStyle = "translit" | "coptic" | "ar";

/** Nome del mese nello stile richiesto, con ripiego sulla traslitterazione. */
export function copticMonthName(month: number, style: MonthNameStyle = "translit"): string {
  const info = COPTIC_MONTHS[month - 1];
  if (!info) return "";
  return (style !== "translit" && info[style]) || info.translit;
}
