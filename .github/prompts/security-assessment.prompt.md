---
agent: agent
description: "Esegui un assessment sicurezza/compliance del progetto con priorita P0-P3, evidenze, remediation raccomandata e roadmap 30-60-90 giorni."
---

Esegui un assessment focalizzato solo su sicurezza e compliance usando la skill security-compliance-assessment.

Usa questo template di output:

1) Executive Summary
- Contesto sintetico
- Rischio complessivo (Basso/Medio/Alto/Critico)
- Principali aree di esposizione

2) Findings Per Severita (P0 -> P3)
Per ogni finding:
- Titolo
- Priorita: P0/P1/P2/P3
- Evidenza: file e linea
- Rischio: cosa puo succedere e impatto
- Remediation raccomandata: azione concreta
- Passo di verifica: come validare il fix
- Sforzo: S/M/L
- Riduzione rischio attesa: Alta/Media/Bassa

3) Containment Immediato (24-72h)
- Azioni urgenti da fare subito

4) Piano 30-60-90 Giorni
- 30 giorni
- 60 giorni
- 90 giorni

5) Rischi Residui E Limiti
- Cosa non e stato possibile verificare
- Assunzioni fatte durante l'analisi

Vincoli:
- Non includere temi non-security.
- Nessun finding senza evidenza.
- Segna Da verificare quando un punto non e verificabile con prove sufficienti.
