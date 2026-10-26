QuickAccessCard from chiesa-san-marco. Use via `window.ChiesaSanMarco.QuickAccessCard` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<DsPreviewProvider>` (full provider chain in README.md — components read theme/i18n from that context).

## Props

```ts
interface QuickAccessCardProps {
href: string;
  /** A lucide-react icon component, passed uninstantiated (e.g. `icon={BookOpen}`). */
  icon: React.ComponentType<{ className?: string; size?: string | number; strokeWidth?: string | number; color?: string }>;
  title: string;
  description: string;
  /** Accent border + accent body text, for the one card that should draw the eye. */
  highlight?: boolean;
  /** Short uppercase pill in the top-right corner (ignored when `comingSoon`). */
  badge?: string;
  /** Stagger for the fade-in-up entrance, in ms. */
  delay?: number;
  /** Locks the card: dimmed, not a link, with a padlock + "Coming Soon" overlay. */
  comingSoon?: boolean;
}
```
