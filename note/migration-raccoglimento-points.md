# Migrazione punti di raccolta

I documenti `eventi` esistenti usavano `raccoglimento` come array di stringhe. Il nuovo formato atteso è:

```ts
raccoglimento: Array<{
  label: string;
  orario: string; // HH:mm
}>
```

## Migrazione consigliata

1. Esporta i documenti `eventi` da MongoDB Atlas.
2. Per ogni elemento di `raccoglimento`:
   - se è una stringa, convertirlo in `{ label: <stringa>, orario: "" }` temporaneamente;
   - completare manualmente l'orario corretto prima di riattivare il form pubblico.
3. Verifica che gli eventi con `showRaccoglimento: true` abbiano almeno un punto con `label` e `orario` valorizzati.
4. Una volta completata la migrazione, salvare gli eventi aggiornati per riscrivere i documenti nel nuovo formato.

## Nota tecnica

Il layer `src/lib/mongo/content.ts` normalizza già in lettura i vecchi valori stringa per mantenere la compatibilità durante la transizione, ma il database va comunque aggiornato per evitare dati parziali nel form pubblico.
