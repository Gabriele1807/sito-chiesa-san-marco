/**
 * Regole liturgiche esplicite.
 *
 * Qui stanno SOLO regole certe, espresse come intervalli di giorni:
 * - mobili: distanza in giorni dalla Pasqua (E±N);
 * - fisse: mese e giorno copti.
 *
 * Le regole con eccezioni o incerte (Natale 28/29 Koiak, Nasi, concomitanze,
 * digiuno del mercoledì e del venerdì) sono in `CONFIGURABLE_RULES`: sono
 * DISATTIVATE per impostazione predefinita e vengono applicate solo dopo che
 * un amministratore ha scelto un valore dal pannello. Finché restano
 * disattivate il risolutore non indovina: segnala il giorno come incerto.
 *
 * Nessun dato liturgico è inventato: ciò che non è certo resta vuoto, con TODO.
 */

import type { LocalizedText } from "./content";

// ---------------------------------------------------------------------------
// Stagioni e digiuni mobili (offset dalla Pasqua, estremi inclusi)
// ---------------------------------------------------------------------------

export type SeasonId =
  | "settimana-santa"
  | "grande-quaresima"
  | "cinquantina"
  | "digiuno-apostoli"
  | "digiuno-natale"
  | "digiuno-giona";

export type FastId = "giona" | "grande-quaresima" | "settimana-santa" | "apostoli" | "natale";

/** Ordine di precedenza quando più stagioni si sovrappongono: la prima vince. */
export const SEASON_PRIORITY: readonly SeasonId[] = [
  "settimana-santa",
  "grande-quaresima",
  "cinquantina",
  "digiuno-apostoli",
  "digiuno-natale",
  "digiuno-giona",
];

export const MOVABLE_RANGES = {
  /** Digiuno di Giona (di Ninive): lunedì-mercoledì, due settimane prima della Quaresima. */
  giona: { from: -69, to: -67 },
  /** Grande Quaresima, compresa la settimana di preparazione: dal lunedì E-55 al venerdì E-8 / sabato di Lazzaro. */
  grandeQuaresima: { from: -55, to: -8 },
  /** Settimana Santa: dalla Domenica delle Palme al Sabato Santo. */
  settimanaSanta: { from: -7, to: -1 },
  /** Santa Cinquantina: dalla Pasqua alla Pentecoste. */
  cinquantina: { from: 0, to: 49 },
  /** Il digiuno degli Apostoli inizia il lunedì dopo Pentecoste e termina il 4 Epip (vedi sotto). */
  apostoliStart: 50,
} as const;

/** Fine del digiuno degli Apostoli: 4 Epip (la festa è il 5 Epip). */
export const APOSTLES_FAST_END = { month: 11, day: 4 } as const;

/** Digiuno della Natività: 43 giorni, dal 16 Hathor alla vigilia del Natale. */
export const NATIVITY_FAST_START = { month: 3, day: 16 } as const;
/**
 * Fine del digiuno se la regola del Natale è disattivata: 28 Koiak.
 * TODO: negli anni in cui il 29 Koiak cade l'8 gennaio, verificare inizio
 * e fine del digiuno insieme alla regola "natale".
 */
export const NATIVITY_FAST_DEFAULT_END = { month: 4, day: 28 } as const;

// ---------------------------------------------------------------------------
// Feste
// ---------------------------------------------------------------------------

export interface FixedFeastDef {
  id: string;
  month: number;
  day: number;
  name: LocalizedText;
}

export interface MovableFeastDef {
  id: string;
  offset: number;
  name: LocalizedText;
}

/**
 * Feste fisse certe (valori predefiniti; l'elenco effettivo arriva dal
 * database ed è modificabile dal pannello admin). Il Natale NON è qui:
 * dipende dalla regola incerta "natale".
 */
export const DEFAULT_FIXED_FEASTS: readonly FixedFeastDef[] = [
  { id: "nayrouz", month: 1, day: 1, name: { it: "Nayrouz (Capodanno copto)", ar: "عيد النيروز" } },
  { id: "croce", month: 1, day: 17, name: { it: "Festa della Croce", ar: "عيد الصليب" } },
  { id: "epifania", month: 5, day: 11, name: { it: "Epifania (Teofania)", ar: "عيد الغطاس" } },
  {
    id: "annunciazione",
    month: 7,
    day: 29,
    name: { it: "Annunciazione", ar: "عيد البشارة" },
  },
  { id: "apostoli", month: 11, day: 5, name: { it: "Festa degli Apostoli", ar: "عيد الرسل" } },
  {
    id: "assunzione",
    month: 12,
    day: 16,
    name: { it: "Assunzione della Vergine Maria", ar: "عيد صعود جسد السيدة العذراء" },
  },
];

/**
 * Feste mobili predisposte, con offset certi. TODO: Giovedì e Venerdì
 * Santo, Pasqua di Giona, Domenica di Tommaso e le altre domeniche della
 * Cinquantina vanno aggiunte quando i contenuti saranno pronti.
 */
export const MOVABLE_FEASTS: readonly MovableFeastDef[] = [
  { id: "palme", offset: -7, name: { it: "Domenica delle Palme", ar: "أحد الشعانين" } },
  { id: "pasqua", offset: 0, name: { it: "Pasqua di Resurrezione", ar: "عيد القيامة المجيد" } },
  { id: "ascensione", offset: 39, name: { it: "Ascensione", ar: "عيد الصعود" } },
  { id: "pentecoste", offset: 49, name: { it: "Pentecoste", ar: "عيد العنصرة" } },
];

export const NATIVITY_NAME: LocalizedText = {
  it: "Natale (Natività del Signore)",
  ar: "عيد الميلاد المجيد",
};

// ---------------------------------------------------------------------------
// Regole incerte, impostabili dal pannello admin
// ---------------------------------------------------------------------------

export type RuleId = "natale" | "nasi6" | "concomitanze" | "mercolediVenerdi";

export interface ConfigurableRule {
  id: RuleId;
  /** Valori ammessi. Nessuno è applicato finché la regola è disattivata. */
  options: readonly string[];
  defaultEnabled: false;
  /** false = la regola è solo predisposta: non può essere attivata finché non viene implementata. */
  implemented: boolean;
  /** Spiegazione per sviluppatori; le etichette dell'interfaccia sono nei file di traduzione. */
  note: string;
}

export const CONFIGURABLE_RULES: readonly ConfigurableRule[] = [
  {
    id: "natale",
    options: ["29-koiak", "7-gennaio"],
    defaultEnabled: false,
    implemented: true,
    note:
      "TODO da verificare: il Natale si celebra il 29 Koiak, che cade il 7 gennaio " +
      "ma l'8 gennaio nell'anno che precede un bisestile gregoriano. '29-koiak' " +
      "lo pone sempre il 29 Koiak; '7-gennaio' lo pone il 7 gennaio (28 Koiak in quegli anni). " +
      "Disattivata: il Natale non viene mostrato e il digiuno termina il 28 Koiak.",
  },
  {
    id: "nasi6",
    options: ["contenuti-propri", "come-5-nasi"],
    defaultEnabled: false,
    implemented: true,
    note:
      "TODO: contenuti del 6° giorno di Nasi negli anni bisestili. 'contenuti-propri' " +
      "usa la chiave 13-06; 'come-5-nasi' riusa la chiave 13-05. Disattivata: chiave 13-06, " +
      "giorno segnalato come incerto.",
  },
  {
    id: "concomitanze",
    options: ["mostra-entrambe", "prevale-stagione-mobile"],
    defaultEnabled: false,
    implemented: true,
    note:
      "TODO: festa fissa che cade nella Settimana Santa o a Pasqua (es. Annunciazione). " +
      "'mostra-entrambe' mostra festa e stagione; 'prevale-stagione-mobile' nasconde la " +
      "festa fissa in quei giorni. Disattivata: entrambe mostrate, giorno segnalato come incerto.",
  },
  {
    id: "mercolediVenerdi",
    options: ["esclusa-cinquantina", "esclusa-cinquantina-e-natale-epifania"],
    defaultEnabled: false,
    implemented: false,
    note:
      "TODO: digiuno del mercoledì e del venerdì e relative esenzioni. Disattivata: " +
      "non viene calcolato.",
  },
];

export type RuleSetting = { enabled: boolean; value: string | null };
export type RuleSettings = Partial<Record<RuleId, RuleSetting>>;

export function findRule(id: string): ConfigurableRule | undefined {
  return CONFIGURABLE_RULES.find((r) => r.id === id);
}

/** Una regola si applica solo se attivata e con un valore ammesso. */
export function ruleIsActive(settings: RuleSettings, id: RuleId): boolean {
  const s = settings[id];
  const rule = findRule(id);
  return Boolean(rule?.implemented && s?.enabled && s.value && rule.options.includes(s.value));
}

export function ruleValue(settings: RuleSettings, id: RuleId): string | null {
  return ruleIsActive(settings, id) ? (settings[id]!.value as string) : null;
}
