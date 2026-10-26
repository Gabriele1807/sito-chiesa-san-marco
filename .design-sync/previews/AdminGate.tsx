import { AdminGate } from "chiesa-san-marco";

// Auth settles on "guest" in the design runtime, so the gate shows its
// COMING SOON state rather than the wrapped admin content.
function Panel() {
  return (
    <div style={{ padding: 20, borderRadius: 16, background: "var(--color-surface)" }}>
      Contenuto riservato agli amministratori
    </div>
  );
}

export function Default() {
  return (
    <div style={{ maxWidth: 460 }}>
      <AdminGate title="Gestione avvisi">
        <Panel />
      </AdminGate>
    </div>
  );
}

export function WithDescription() {
  return (
    <div style={{ maxWidth: 460 }}>
      <AdminGate
        title="Statistiche iscrizioni"
        description="Questa sezione sarà disponibile a breve per gli amministratori della comunità."
      >
        <Panel />
      </AdminGate>
    </div>
  );
}
