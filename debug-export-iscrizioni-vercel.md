# Debug Session: export-iscrizioni-vercel
- **Status**: [OPEN]
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
- In attesa di evidenze runtime e implementazione del fix minimo.
