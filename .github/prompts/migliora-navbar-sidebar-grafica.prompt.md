---
description: "Migliora grafica e comportamento di navbar e sidebar nel sito pubblico: navbar fissa con dissolvenza su scroll down/riapparizione su scroll up e fix bug grafico sidebar da screenshot."
name: "Migliora Navbar + Sidebar (Grafica)"
argument-hint: "Dettagli bug sidebar + path screenshot + eventuali preferenze (es. soglia scroll 96px, durata 220ms)"
agent: agent
tools: [read_file, file_search, grep_search, apply_patch, get_errors]
---

Leggi SEMPRE prima il contesto architetturale del progetto:
[PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)

---

## Task

Migliora la UX/navigation shell dell'area pubblica concentrandoti solo su:
1. **Navbar**: deve essere sempre in alto e visibile all'avvio, rimanere fissa durante lo scroll, poi iniziare a scomparire con un effetto di dissolvenza quando l'utente scorre verso il basso oltre una soglia breve; deve tornare visibile quando l'utente risale.
2. **Sidebar**: individua e correggi il bug grafico descritto in **$0** (testo + screenshot allegati/path).

Non cambiare funzionalita non correlate.

---

## Input Atteso

L'argomento **$0** deve contenere, quando disponibili:
- descrizione del bug sidebar
- path del/dei file screenshot nel workspace (es. `note/sidebar-bug-1.png`)
- eventuali preferenze micro-animazione (soglia scroll, durata, easing)

Se uno di questi dati manca:
- procedi comunque con assunzioni ragionevoli
- esplicita le assunzioni nell'output finale

---

## Procedura Obbligatoria

1. **Leggi contesto**
   - Apri [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md) prima di toccare codice.

2. **Analisi file coinvolti**
   - Cerca e leggi i componenti/layout di navigazione pubblica, in particolare:
     - `src/components/Navbar.tsx`
     - `src/components/Sidebar.tsx`
     - `src/app/(main)/layout.tsx`
     - `src/app/globals.css`
     - eventuali componenti collegati (`MobileMenuButton`, overlay mobile, wrapper shell)

3. **Implementa comportamento navbar**
   - Mantieni la navbar in posizione fissa top (`fixed top-0`) e con `z-index` adeguato.
   - Evita overlap del contenuto aggiungendo il corretto offset/padding top nel layout.
   - Implementa logica scroll direction-aware:
     - visibile all'avvio
     - su scroll down oltre soglia breve: fade out progressivo (eventuale leggero translateY negativo)
     - su scroll up: ritorno rapido ma fluido
   - Rispetta accessibilita:
     - supporto `prefers-reduced-motion`
     - niente flicker vicino alla soglia (usa hysteresis/debounce leggera)

4. **Fix bug grafico sidebar**
   - Usa la descrizione in **$0** e gli screenshot per individuare il problema reale.
   - Correggi il bug con modifica minima e coerente con lo stile corrente.
   - Se il bug riguarda responsive/overlay/z-index/transizioni, verifica che non regredisca desktop e mobile.

5. **Vincoli**
   - Non introdurre librerie nuove (niente framer-motion/gsap).
   - Usa Tailwind/CSS esistente e, solo se necessario, piccole aggiunte in `globals.css`.
   - Non toccare area admin salvo impatti condivisi inevitabili.

6. **Verifica tecnica**
   - Esegui controllo errori (`get_errors`) sui file modificati.
   - Conferma assenza regressioni evidenti di layout (navbar copre contenuti, sidebar non cliccabile, overlay errato).

---

## Output Finale Richiesto

Fornisci sempre:
1. elenco file modificati
2. riepilogo puntuale delle modifiche
3. assunzioni fatte (se mancavano dati in **$0**)
4. breve checklist di verifica manuale:
   - scroll down lento/veloce
   - scroll up
   - top pagina
   - mobile menu + sidebar
   - breakpoint principali

---

## Esempi Invocazione

- `/Migliora Navbar + Sidebar (Grafica) bug sidebar: su mobile il pannello resta sotto la navbar; screenshot: note/sidebar-mobile-overlap.png`
- `/Migliora Navbar + Sidebar (Grafica) bug: il bordo sinistro della sidebar lampeggia in apertura; screenshot: note/sb-flicker.png; soglia 88px durata 200ms`
