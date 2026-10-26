## Building with the Chiesa San Marco library

The component library of the Chiesa Copta Ortodossa di San Marco (Milan) website.
It is a **Tailwind-based** system: components carry their own classes, and you
write layout glue with the same utility vocabulary, which is bound to the brand
tokens below. Interface copy is **Italian** — write Italian strings, not English.

### Wrap the tree in `DsPreviewProvider`

Every component that reads translations, the session, or the sidebar throws
without it — `useTranslations`, `useAuth` and `useSidebar` all raise rather than
degrade. Wrap once, at the root:

```jsx
const { DsPreviewProvider, QuickAccessCard } = window.ChiesaSanMarco;

<DsPreviewProvider>
  <YourScreen />
</DsPreviewProvider>
```

It supplies the Italian message catalogue, an auth session (which resolves to
**guest** — `GuestGate` and `AdminGate` therefore render their locked state), and
the sidebar context. Without it most cards come up blank.

### The styling idiom: Tailwind utilities on brand tokens

Use these names — they are real utilities in the shipped stylesheet. Do **not**
invent a parallel palette, and prefer them over raw hex or Tailwind's default
grays:

| Family | Names |
|---|---|
| Surfaces | `bg-background` (warm page cream), `bg-surface` (white card), `bg-surface-2`, `bg-sidebar` (near-black) |
| Text | `text-foreground`, `text-foreground/70` (secondary), `text-accent`, `text-primary`, `text-gold`, `text-sage` |
| Accent / actions | `bg-accent`, `bg-primary`, `bg-gold` — `accent` is the burnt-orange that carries almost every call to action |
| Borders | `border-border` |
| Type | `font-display` (Cormorant Garamond, headings only), body text inherits Source Sans 3 |
| Motion | `card-hover`, `btn-hover`, `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in` |

The same values exist as CSS variables when you need them outside a class:
`--color-background`, `--color-foreground`, `--color-surface`, `--color-surface-2`,
`--color-border`, `--color-accent`, `--color-primary`, `--color-gold`,
`--color-sage`, `--color-burgundy`, `--color-sidebar`, plus `--font-display`,
`--font-body`, `--font-arabic`.

**The stylesheet is pre-compiled, not generated on the fly.** It contains only
the utilities this site already uses, so an unused one simply does not exist —
`grid-cols-2` and `grid-cols-3` are there, `grid-cols-4` is not. If a utility
seems to do nothing, that is why: reach for a class the library itself uses, or
set the property with an inline style or a `var(--color-*)` token.

House style, visible across the library: generously rounded cards
(`rounded-xl` … `rounded-3xl`), soft shadows, and section titles set in small
uppercase with wide tracking (`text-sm uppercase tracking-[0.2em]`).

### Where the truth lives

- `styles.css` and the stylesheet it imports — the full token and utility set.
- `components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts` — the real props
  for each component. Read these before passing props; several components take
  structured objects (`LegalDocument`'s `copy`, `EventRegistrations`' `events`).
- Groups: `general`, `admin`, `charts`, `auth`, `avvisi`, `pwa`, `profile`, `legal`.

Icons are **lucide-react** components passed uninstantiated: `icon={BookOpen}`,
never `icon={<BookOpen />}`.

### An idiomatic screen

```jsx
const { DsPreviewProvider, QuickAccessCard, StatTile } = window.ChiesaSanMarco;
import { CalendarDays, HandHeart, Users } from "lucide-react";

<DsPreviewProvider>
  <main className="bg-background min-h-screen p-6">
    <h1 className="font-display text-foreground mb-6 text-3xl">La comunità</h1>

    <div className="mb-8 grid grid-cols-2 gap-4">
      <StatTile label="Iscritti totali" value={412} detail="+18 questo mese" icon={Users} />
      <StatTile label="Eventi pubblicati" value={9} icon={CalendarDays} />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <QuickAccessCard href="/preghiere" icon={HandHeart} title="Preghiere"
        description="Le preghiere quotidiane della tradizione copta." />
      <QuickAccessCard href="/eventi" icon={CalendarDays} title="Eventi"
        description="Iscriviti alle celebrazioni della comunità." highlight />
    </div>
  </main>
</DsPreviewProvider>
```

`NotificationPrompt` only ever appears inside an installed PWA, so it renders
nothing in a design — don't reach for it.
