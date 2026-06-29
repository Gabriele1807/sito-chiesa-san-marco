---
agent: agent
description: "Esegui una correzione mirata dei problemi di qualità del codice e avvia una seconda analisi di follow-up per gli stessi motivi (qualità, sicurezza)."
---

Esegui una correzione mirata dei problemi di qualità del codice e sicurezza appena identificati nel progetto.
Includi anche una seconda analisi di follow-up che verifichi lo stesso spazio di rischio e garantisca che non ci siano pattern simili non ancora risolti.

Usa questo template di output:

1) Executive Summary
- Contesto sintetico
- Stato complessivo dopo le correzioni (Rischio Basso/Medio/Alto)
- Principali modifiche applicate

2) Correzioni Eseguite
Per ogni correzione:
- Titolo
- File/linea
- Azione eseguita
- Perché risolve il problema
- Verifica: come controllare che il fix funzioni

3) Analisi Secondaria di Follow-up
- Scope: quali aree del progetto sono state riviste di nuovo
- Obiettivo: quali rischi/qualità sono stati ricontrollati
- Metodo: strumenti, grep, test o audit utilizzati
- Risultato: cosa è stato confermato o ulteriormente individuato

4) Piano 30-60-90 Giorni
- 30 giorni: azioni immediate e stabilizzazione
- 60 giorni: riduzione del debito tecnico e hardening
- 90 giorni: prevenzione regressioni e miglioramento continuo

5) Rischi Residui E Limiti
- Cosa non è possibile verificare senza ulteriori strumenti o accesso
- Assunzioni fatte durante l’analisi

Vincoli:
- Non includere temi non code-quality/security.
- Nessun fix senza evidenza.
- Segna "Da verificare" quando un punto non è verificabile con prove sufficienti.
- Dai priorità ad azioni minime, sicure e misurabili.
