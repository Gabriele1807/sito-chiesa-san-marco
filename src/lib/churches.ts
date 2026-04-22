export const CHIESE_LIST = [
  "Chiesa Copta di San Giorgio – Roma",
  "Chiesa Copta di San Marco – Torino",
  "Chiesa Copta della Vergine Maria – Bologna",
  "Chiesa Copta di San Mina – Firenze",
  "Chiesa Copta di San Paolo – Napoli",
  "Altra chiesa",
] as const;

export type ChurchName = (typeof CHIESE_LIST)[number];