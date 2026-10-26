/**
 * Dati identificativi del titolare del trattamento / dell'ente.
 *
 * TODO (prima della pubblicazione): compilare i campi vuoti con i dati
 * ufficiali dell'ente. I campi vuoti non vengono mostrati da nessuna parte
 * (footer, informativa privacy), quindi non compaiono segnaposto sul sito.
 */
export const LEGAL_ENTITY = {
  name: "Chiesa Copta Ortodossa di San Marco – Milano",
  address: "Via Senato 4, 20121 Milano (MI)",
  email: "info@sanmarcocopti.it",
  /** Codice fiscale dell'ente */
  taxCode: "",
  /** Partita IVA, se presente */
  vatNumber: "",
  /** Posta elettronica certificata */
  pec: "",
  /** Legale rappresentante (es. parroco pro tempore) */
  legalRepresentative: "",
} as const;

/** Righe di identificazione fiscale, solo per i campi compilati. */
export function legalIdentifiers(): string[] {
  const out: string[] = [];
  if (LEGAL_ENTITY.taxCode) out.push(`C.F. ${LEGAL_ENTITY.taxCode}`);
  if (LEGAL_ENTITY.vatNumber) out.push(`P.IVA ${LEGAL_ENTITY.vatNumber}`);
  if (LEGAL_ENTITY.pec) out.push(`PEC ${LEGAL_ENTITY.pec}`);
  return out;
}
