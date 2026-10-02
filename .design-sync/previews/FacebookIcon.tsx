import { FacebookIcon } from "chiesa-san-marco";

// The icon is a bare SVG that fills its box, so each cell sets a size.
export function Default() {
  return <FacebookIcon className="h-6 w-6" />;
}

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <FacebookIcon className="h-4 w-4" />
      <FacebookIcon className="h-6 w-6" />
      <FacebookIcon className="h-10 w-10" />
    </div>
  );
}

export function OnASignInButton() {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-foreground)",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <FacebookIcon className="h-5 w-5" />
      Continua con Facebook
    </button>
  );
}
