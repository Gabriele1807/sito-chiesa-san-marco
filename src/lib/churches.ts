export const CHIESE_LIST = [
  "Chiesa Copta della Vergine Maria e Sant'Antonio – Cinisello",
  "Chiesa Copta di San Simeone e Sant'Anna – Gorla",
  "Chiesa Copta dei Santi Zaccaria ed Elisabetta – Melchiorre Gioia",
  "Chiesa Copta di San Mina – Pero",
  "Chiesa Copta dei Santi Apostoli - San Giuseppe d'Arimatea – Corvetto",
  "Chiesa Copta di San Shenuda Archimandrita – Lacchiarella",
  "Chiesa Copta di Sant'Abramo – Vigevano",
  "Chiesa Copta dell'Arcangelo Michele – Brescia",
  "Altra chiesa",
] as const;

export type ChurchName = (typeof CHIESE_LIST)[number];