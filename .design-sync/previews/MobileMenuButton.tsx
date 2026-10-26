import { MobileMenuButton } from "chiesa-san-marco";

export function Default() {
  return <MobileMenuButton />;
}

export function InATopbar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        height: 56,
        padding: "0 12px",
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <MobileMenuButton />
      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--color-foreground)" }}>Preghiere</span>
      <span style={{ width: 44 }} />
    </div>
  );
}
