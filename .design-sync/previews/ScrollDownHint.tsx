import { ScrollDownHint } from "chiesa-san-marco";

export function Default() {
  return <ScrollDownHint />;
}

export function OnAHero() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 16,
        height: 220,
        padding: 24,
        borderRadius: 16,
        background: "var(--color-surface-alt, #FFF3E6)",
      }}
    >
      <p style={{ margin: 0, textAlign: "center", color: "var(--color-foreground)", fontFamily: "var(--font-display)", fontSize: 28 }}>
        Chiesa Copta Ortodossa di San Marco
      </p>
      <ScrollDownHint targetId="quick-access" />
    </div>
  );
}
