import { GuestGate } from "chiesa-san-marco";

// The preview provider's session lookup cannot reach an API here, so auth
// settles on "guest" — the locked state this component exists to show.
function Restricted() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, color: "var(--color-foreground)" }}>
        Elenco dei partecipanti
      </h3>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "color-mix(in srgb, var(--color-foreground) 70%, transparent)" }}>
        Marco Rossi · Sara Bianchi · Youssef Aziz · Mina Gerges
      </p>
    </div>
  );
}

export function Locked() {
  return (
    <div style={{ maxWidth: 420 }}>
      <GuestGate>
        <Restricted />
      </GuestGate>
    </div>
  );
}

export function CustomMessage() {
  return (
    <div style={{ maxWidth: 420 }}>
      <GuestGate message="Accedi per vedere chi partecipa a questo evento.">
        <Restricted />
      </GuestGate>
    </div>
  );
}
