# Prompt di follow-up: rifiniture grafiche sito pubblico (Task 12 rimandato)

> Questo file non è uno spec — è il prompt pronto da incollare in una
> futura sessione Claude Code per completare il Task 12 dell'audit
> `fix/security-ux-graphics-audit`, rimandato perché quella sessione non
> aveva accesso a un browser reale per la verifica visiva.

## Come darmi l'accesso necessario prima di eseguirlo

Nella nuova sessione, prima di incollare il prompt qui sotto:

1. Esegui `/chrome` (o l'equivalente comando di setup dell'estensione
   "Claude in Chrome") e completa il collegamento dell'estensione al
   browser. Senza questo passaggio non posso vedere né interagire con le
   pagine renderizzate.
2. Se preferisci non installare l'estensione, in alternativa posso usare
   `chromium-cli` (headless) se disponibile nell'ambiente: verifica con
   `which chromium-cli` prima di iniziare — se manca, chiedimi di
   procedere comunque solo con analisi statica (rifiniture più limitate).
3. Assicurati che il branch `fix/security-ux-graphics-audit` (o quello in
   cui è confluito, es. dopo merge/PR) sia il branch corrente, e che
   `npm run dev` funzioni senza errori.
4. Nessun accesso a dati sensibili è necessario per questo task (è solo
   sito pubblico, nessun login richiesto).

## Prompt da incollare

```
Riprendi il Task 12 dell'audit sicurezza/UX/grafica del progetto
(vedi docs/superpowers/specs/2026-09-12-security-ux-graphics-audit-design.md
e docs/superpowers/plans/2026-09-12-security-ux-graphics-audit.md per il
contesto completo — non serve rileggerli integralmente, ma sappi che
esistono). Nella sessione precedente Task 1-11, 13-15 sono stati
completati e mergiati/pronti; il Task 12 (rifiniture grafiche leggere sul
sito pubblico) è stato rimandato per mancanza di accesso a un browser
reale per la verifica visiva.

OBIETTIVO: applicare rifiniture grafiche NON drastiche al sito pubblico
(src/app/(main)/**), motivabili una per una, senza cambiare struttura,
palette, layout o identità visiva. Nessun redesign.

PROCEDI COSÌ:
1. Invoca la skill `ui-ux-pro-max` (o `frontend-design`/`ui-styling`) per
   una diagnosi strutturata di ritmo spazi, gerarchia tipografica,
   contrasto, stati hover/focus mancanti sulle pagine pubbliche
   principali (home, eventi, icone, libreria, orari, preghiere,
   video-corsi, chi-siamo, contatti).
2. Usa la skill `run` per avviare `npm run dev` e pilotare un browser
   reale (Claude in Chrome, o chromium-cli se disponibile) — non
   limitarti all'analisi statica del codice: guarda davvero le pagine
   renderizzate, in italiano E in arabo (imposta il cookie `locale=ar` o
   usa il selettore lingua in UI).
3. Per ogni incoerenza reale trovata (non ipotetica), applica la
   modifica minima con classi Tailwind già esistenti nel design system
   (nessun nuovo colore/font/breakpoint), verificane l'effetto nel
   browser prima e dopo, e annota in una frase perché era necessaria.
4. Presta particolare attenzione a:
   - la verifica in arabo/RTL: nota che `dir="ltr"` in
     `src/app/layout.tsx` è hardcoded e l'RTL si basa solo su
     `[data-locale="ar"] { text-align: right }` in `globals.css` — NON
     cambiare questo meccanismo strutturale in questo task (è un limite
     noto documentato in PROJECT_CONTEXT.md §6.4.1), ma verifica che i
     tuoi interventi non lo rompano ulteriormente;
   - i tre font brand (Source_Sans_3, Cormorant_Garamond,
     Noto_Naskh_Arabic) devono restare intatti;
   - stati hover/focus-visible mancanti su elementi interattivi
     (bottoni, link, card cliccabili) sono il tipo di fix più utile e
     sicuro da applicare qui.
5. Non toccare il blocco commentato della card iscrizione evento in
   src/app/(main)/page.tsx né altro codice commentato intenzionale.
6. Esegui npm run lint && npm run build alla fine e correggi ogni
   errore introdotto.
7. Riassumi in italiano cosa hai trovato, cosa hai cambiato e perché,
   con screenshot prima/dopo se possibile.
```
