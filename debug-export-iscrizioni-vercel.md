# Debug Session: export-iscrizioni-vercel
- **Status**: [RESOLVED 2026-09-26] — causa trovata: vedi "Verification Conclusion"
- **Issue**: In produzione su Vercel i pulsanti di export iscrizioni (`PDF` e `Excel`) non funzionano piu, mentre in locale funzionavano. Inoltre va aggiunta la scelta delle colonne da includere nel PDF prima dell'esportazione.
- **Environment**: Vercel production + admin dashboard iscrizioni

## Reproduction Steps
1. Accedere come admin o superadmin.
2. Aprire `Admin > Iscrizioni Eventi`.
3. Selezionare un evento.
4. Premere `Excel` o `PDF`.
5. Verificare il comportamento in locale e in produzione.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | La route di export usa librerie o API runtime che su Vercel falliscono o generano 500. | High | Med | Pending |
| B | Il download client-side apre correttamente l'URL, ma la response di produzione non e un file valido o e bloccata da errore server. | High | Low | Pending |
| C | L'header di autorizzazione admin o il middleware non propagano correttamente i permessi sulla route export in produzione. | Med | Med | Pending |
| D | L'export Excel e PDF condividono una stessa parte di codice che rompe tutto in produzione. | Med | Med | Pending |
| E | La selezione colonne PDF richiede una UI dedicata nel pannello admin e il passaggio dei campi scelti alla route export. | High | Low | Pending |

## Log Evidence
- In attesa di analisi delle route export, del client admin e di eventuale riproduzione locale.

## Verification Conclusion
- Causa riprodotta (2026-09-26): il PDF usa i font standard di pdf-lib (Helvetica,
  codifica WinAnsi) e `drawText` lancia `WinAnsi cannot encode …` su qualunque
  carattere fuori da quel set (arabo, copto, emoji, lettere come "Ğ"). In locale
  i dati di prova erano solo latini; in produzione basta un'iscrizione con un
  nome in arabo per far fallire l'intero export con 500 (ipotesi A/B confermate).
- Fix: `src/lib/pdf/winansi.ts` (`createPdfTextSanitizer`) applicato a tutti i
  testi dinamici in `src/app/api/admin/iscrizioni/export/route.ts`; i caratteri
  non rappresentabili diventano `?` e il PDF riporta una nota. Test:
  `src/app/api/admin/iscrizioni/export/route.test.ts` (fallisce senza il fix).
- La selezione delle colonne (ipotesi E) è già implementata (`columns=`).
- Aperto: rendering completo dell'arabo richiede un font Unicode con shaping.
