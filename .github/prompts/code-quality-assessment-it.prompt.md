---
agent: agent
description: "Esegui un assessment della qualita del codice con priorita P0-P3, evidenze, interventi raccomandati e piano 30-60-90 giorni."
---

Esegui un assessment della qualita del codice usando la skill code-quality-assessment-it.

Usa questo template di output:

1) Executive Summary
- Contesto sintetico
- Stato complessivo della qualita (Rischio Basso/Medio/Alto)
- Principali aree critiche

2) Findings Per Severita (P0 -> P3)
Per ogni finding:
- Titolo
- Priorita: P0/P1/P2/P3
- Evidenza: file e linea
- Perche conta: rischio tecnico o impatto business
- Intervento raccomandato: azione concreta
- Sforzo: S/M/L
- Impatto atteso: Alto/Medio/Basso

3) Piano 30-60-90 Giorni
- 30 giorni: stabilizzazione e quick wins
- 60 giorni: riduzione debito tecnico strutturale
- 90 giorni: hardening e prevenzione regressioni

4) Quick Wins (< 1 giorno)
- Elenco azioni ad alto valore e bassa complessita

5) Assunzioni E Limiti
- Cosa non e stato possibile verificare
- Assunzioni adottate durante l'analisi

Vincoli:
- Nessun finding senza evidenza.
- Segna Da verificare quando un punto non e verificabile con prove sufficienti.
- Dai priorita ad azioni minime sicure e misurabili.
- Se mancano strumenti (lint/test), dichiaralo esplicitamente.
