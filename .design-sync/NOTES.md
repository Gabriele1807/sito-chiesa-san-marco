# design-sync notes — chiesa-san-marco

Repo-specific gotchas for future syncs. Read this before re-running.

## Shape: this is an app, not a component library

- `chiesa-san-marco` is a private Next.js app. There is **no `dist/`, no `exports`
  field and no Storybook**, so the converter's normal "bundle the published dist"
  path does not exist. The design system is a hand-written barrel entry at
  `.design-sync/ds-entry/index.ts` that re-exports the presentational components;
  the build is pointed at it with `--entry`.
- The barrel is the scope decision, together with `cfg.componentSrcMap` (26 named
  components). Feature components wired to MongoDB, the auth session or
  server-only APIs are deliberately **excluded** — they cannot render outside the
  app. Adding a component means editing BOTH the barrel and `componentSrcMap`.
- `exportedNames()` finds nothing (no package `types` entry), so the component
  list comes entirely from `componentSrcMap`. That is by design, not a bug.

## Build commands (in order)

```sh
# 1. deps (node_modules goes stale fast in this repo — check `npm ls --depth=0`)
npm ci

# 2. compile the Tailwind v4 stylesheet the bundle ships
node .ds-sync/node_modules/@tailwindcss/cli/dist/index.mjs \
  -i .design-sync/ds-css-entry.css -o .design-sync/.cache/ds-compiled.css

# 3. emit real .d.ts (the repo is noEmit, so declarations must be generated)
node ./node_modules/typescript/bin/tsc -p .design-sync/tsconfig.dts.json

# 4. converter
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry .design-sync/ds-entry/index.ts --out ./ds-bundle
```

Steps 2 and 3 are **not optional** and nothing re-runs them automatically.

## Why each workaround exists

- **`src/app/globals.css` is Tailwind v4 source**, not a compiled stylesheet.
  Shipping it directly leaves `@import "tailwindcss"` dangling. It is compiled via
  `.design-sync/ds-css-entry.css`, which also carries the fonts (below). Tailwind
  v4 auto-detects content from the repo, so utilities used by components are kept.
- **Fonts.** The app loads Source Sans 3, Cormorant Garamond and Noto Naskh Arabic
  through `next/font/google` in `src/app/layout.tsx`, which only runs at Next build
  time. `ds-css-entry.css` requests the same families from Google Fonts and binds
  `--font-body` / `--font-display` / `--font-arabic`. Validate reports
  `[FONT_REMOTE]` for this — expected, not a problem.
  **`cfg.tokensGlob` does nothing without `cfg.tokensPkg`** (`lib/css.mjs`
  `copyTokens` returns early) — that is why the fonts live in the CSS entry and
  `tokens/` is empty.
- **`.d.ts` contracts.** The repo compiles with `noEmit`, and most components
  declare props inline rather than as a named `<Name>Props` interface, which is
  what the extractor matches. Declarations are generated into `dist/types/`
  (gitignored) and the inline-typed components get hand-written bodies in
  `cfg.dtsPropsFor`. **If a component's props change, update `dtsPropsFor`** —
  nothing detects the drift.
  `LucideIcon` is written as a self-contained `React.ComponentType<...>` because
  the emitted contract may not import it.
- **`process` shim.** `src/components/pwa/push-client.ts` reads
  `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY` at module top level. Next replaces
  that at build time; a plain browser throws `ReferenceError` during bundle init
  and `window.ChiesaSanMarco` never gets assigned (symptom: `[BUNDLE_EXPORT]
  26/26 not a component`). `.design-sync/ds-entry/process-shim.ts` must stay the
  **first import** in the barrel. Its VAPID value is a throwaway generated public
  key, not the site's.
- **`next/link` and `next/navigation`** are aliased to local shims via
  `cfg.tsconfig` → `.design-sync/tsconfig.ds.json` `paths`. The design runtime has
  no Next router, so the real modules have no context to read. The link shim
  renders the same `<a>` the real one produces.
- **Providers.** `useAuth` and `useSidebar` both *throw* without their providers,
  and `useTranslations` needs next-intl. `DsPreviewProvider` nests all three
  (next-intl `it` → AuthProvider → SidebarProvider) and is wired through
  `cfg.provider`. Its session fetch cannot reach an API, so auth settles on
  **guest** — which is the state `GuestGate` and `AdminGate` are meant to show.

## Preview techniques that were needed here

- **Overlays** (`ConfirmModal`, and the iOS sheet inside `InstallAppButton`) use
  `position: fixed`, so they escape the preview cell. The previews wrap them in a
  box with `transform: translateZ(0)`, which makes that box the containing block
  for fixed descendants. Presentation only — the components are untouched.
- **`AdminToast` is imperative**: it paints nothing until `showToast()` is called
  and clears itself after 3s. Its preview re-fires on a 1.2s interval so the toast
  is on screen whenever the card is captured. `showToast` is exported from the
  barrel for this reason.
- **`InstallAppButton`** hides unless the browser offered installation. Its preview
  calls `initInstallStore()` and dispatches a real `beforeinstallprompt` event —
  the same path a real browser takes.

## Known render warns (triaged — a warn NOT listed here is new)

- `ScrollDownHint`, `MobileMenuButton`, `BackLink` — flagged thin/small. They are
  genuinely small controls (a 40px circle, a 44px hamburger, a one-line link).
- `BackLink`, `PreghieraExpand` — variants look similar because the only thing
  that differs between them is label text.

## Limitations / Re-sync risks

- **`PreghieraExpand` only ever shows its collapsed trigger.** The expanded prayer
  panel is behind a click and has no prop to force it open, so no card can show it.
- **`NotificationPrompt`** only renders inside an installed PWA, after a 3s delay,
  with `Notification.permission === "default"`. Not reproducible in a headless
  capture — expect it on the floor card.
- **`IconaQRSection`** encodes `window.location.origin`, so the URL under the QR is
  whatever host serves the preview, never the production domain.
- **`dtsPropsFor` is hand-maintained** (22 entries) and will silently rot if the
  components' props change. It is the single most likely thing to go stale.
- The generated `dist/types/` and the compiled CSS are **build inputs that are not
  regenerated by the converter** — a re-sync that skips steps 2–3 above will ship
  stale contracts or a stale stylesheet.
- Playwright: the machine's browser cache pins **chromium build 1234**, which is
  `playwright@1.62.0`. A newer playwright fails with "Executable doesn't exist".
- The repo's `node_modules` was badly out of sync with `package-lock.json` at first
  sync (wrong `next`, `next-intl`, `vitest`; `web-push` missing). Verify with
  `npm ls --depth=0` before building.

## The stylesheet is content-scanned (important)

`ds-compiled.css` is Tailwind v4 output, so it contains **only the utilities this
repo already uses**. `grid-cols-4`, for instance, is absent while `grid-cols-2`
and `grid-cols-3` are present. A design that reaches for an unused utility gets
nothing. This is called out in `conventions.md`; if the synced surface grows,
re-check that the classes the conventions file enumerates still compile.
