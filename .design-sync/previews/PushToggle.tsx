import { PushToggle } from "chiesa-san-marco";

// Takes no props: it reads the browser's notification permission and the
// install state, and renders the matching row. In a desktop browser with
// notifications blocked it shows the "blocked in browser settings" state.
export function Default() {
  return (
    <div style={{ maxWidth: 480 }}>
      <PushToggle />
    </div>
  );
}

export function InASettingsCard() {
  return (
    <div
      style={{
        maxWidth: 480,
        padding: 20,
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-display)", fontSize: 20, color: "var(--color-foreground)" }}>
        Impostazioni notifiche
      </h3>
      <PushToggle />
    </div>
  );
}
