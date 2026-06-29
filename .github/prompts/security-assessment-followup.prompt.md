---
agent: agent
description: "Esegui un assessment sicurezza/compliance sui problemi identificati e includi una seconda analisi del progetto per gli stessi motivi." 
---

Esegui un assessment focalizzato solo su sicurezza e compliance usando la skill security-compliance-assessment.
Aggiungi un passaggio che definisce una seconda analisi del progetto per verificare ulteriormente le stesse aree di rischio.

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

5) Analisi Secondaria Raccomandata
- Scope: quali aree del progetto rivedere nuovamente
- Obiettivo: quali vulnerabilita e compliance verificare
- Metodo: strumenti, check aggiuntivi, test o audit da eseguire
- Frequenza: come e quando ripetere questa seconda revisione

6) Rischi Residui E Limiti
- Cosa non e stato possibile verificare
- Assunzioni fatte durante l'analisi

Vincoli:
- Non includere temi non-security.
- Nessun finding senza evidenza.
- Segna Da verificare quando un punto non e verificabile con prove sufficienti.
