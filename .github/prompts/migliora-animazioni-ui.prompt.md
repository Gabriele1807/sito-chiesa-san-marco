---
description: "Usa per migliorare la fluidità visiva del sito aggiungendo animazioni UI/UX: entrata pagine, hover card, skeleton loader, transizioni modale, scroll reveal. Evita che il sito sembri statico."
name: "Migliora Animazioni UI/UX"
argument-hint: "Componente o area da animare (es. 'pagina icone', 'card evento', 'sidebar', 'modale login')"
agent: agent
tools: [read_file, grep_search, file_search, replace_string_in_file, multi_replace_string_in_file, get_errors]
---

Leggi il file di contesto del progetto per avere tutta l'architettura necessaria:
[PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)

---

## Obiettivo

Migliorare la fluidità visiva di **$0** aggiungendo animazioni UI/UX coerenti con il resto del sito.
Il risultato deve sembrare un sito moderno e curato, non statico.

---

## Principi da rispettare SEMPRE

1. **Nessuna libreria esterna** — Usare solo Tailwind CSS v4 + CSS custom in `globals.css`. Non installare framer-motion, GSAP o altro.
2. **Coerenza visiva** — Il sito usa `cubic-bezier(0.4, 0, 0.2, 1)` come curva di default e `duration-300` come durata base. Rispettare questi valori.
3. **Accessibilità** — Wrappare animazioni non essenziali in `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` già presente o da aggiungere in `globals.css`.
4. **Niente over-engineering** — Animare solo ciò che è richiesto o chiaramente necessario. Non modificare logica, routing o stato.
5. **Colori del progetto** — navy `#0F1A2E`, oro `amber-600`, bianco. Le animazioni non devono introdurre nuovi colori.

---

## Step 1 — Analisi dell'area target

Leggi i file coinvolti:
- Il componente o la pagina specificata nell'argomento
- `src/app/globals.css` per le animazioni già definite (es. `fadeInUp`)
- Eventuali componenti collegati (card, modale, lista)

Identifica:
- Cosa è già animato (cerca `transition-`, `animate-`, `duration-`)
- Cosa è statico e beneficerebbe di un'animazione
- Se serve aggiungere keyframe custom in `globals.css` o bastano classi Tailwind

---

## Step 2 — Pattern di animazione disponibili

Scegli il pattern adatto al contesto:

### Entrata pagina / lista di elementi
```css
/* globals.css — aggiungere se non presente */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
Classe Tailwind: `animate-[fadeInUp_0.4s_ease_both]`

Per liste con stagger (ogni elemento entra dopo): usare `style={{ animationDelay: `${index * 60}ms` }}` sul singolo item.

### Hover su card / link
```
hover:scale-[1.02] hover:shadow-lg transition-all duration-300
```
Per card con immagine: `overflow-hidden` sul wrapper + `hover:scale-105 transition-transform duration-500` sull'`<img>`.

### Skeleton loader (mentre i dati caricano)
```tsx
<div className="animate-pulse rounded-xl bg-gray-200 h-40 w-full" />
```

### Apertura modale / overlay
```css
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```
Classe: `animate-[scaleIn_0.25s_cubic-bezier(0.4,0,0.2,1)_both]`
Overlay backdrop: `animate-[fadeIn_0.2s_ease_both]`

### Pulsante / CTA
```
active:scale-95 transition-transform duration-150
```
Combinato con `hover:brightness-110`.

### Sidebar / drawer mobile
Già ha `transition-transform duration-300 ease-in-out`. Se manca l'overlay:
```
animate-[fadeIn_0.2s_ease_both]
```

---

## Step 3 — Implementazione

1. Aggiungi i keyframe necessari in `src/app/globals.css` solo se non già presenti
2. Applica le classi di animazione nei file JSX/TSX coinvolti
3. Per stagger su liste, aggiungi `animationDelay` inline sul map dei singoli item
4. Non cambiare layout, colori, logica o state management

---

## Step 4 — Verifica

- Controlla errori TypeScript con `get_errors`
- Verifica che `globals.css` non abbia keyframe duplicati
- Conferma che le classi Tailwind usate esistano o siano definite in `globals.css`

---

## Output atteso

- File modificati con le animazioni aggiunte
- Breve elenco di cosa è stato animato e perché
- Suggerimento per la prossima area da migliorare (se evidente)
