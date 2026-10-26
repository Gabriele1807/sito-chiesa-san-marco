import { ConfirmModal } from "chiesa-san-marco";

const noop = () => {};

// ConfirmModal is a full-screen overlay (`fixed inset-0`). A `transform` on an
// ancestor makes that ancestor the containing block for fixed-position
// descendants, so the dialog stages itself inside the card instead of escaping
// to the viewport. This is presentation only — the component is untouched.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        transform: "translateZ(0)",
        height: 300,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export function Danger() {
  return (
    <Stage>
      <ConfirmModal
        open
        title="Eliminare l'avviso?"
        message="L'avviso «Orari della Settimana Santa» verrà rimosso dal sito. L'operazione non può essere annullata."
        confirmLabel="Elimina"
        onConfirm={noop}
        onCancel={noop}
      />
    </Stage>
  );
}

export function Primary() {
  return (
    <Stage>
      <ConfirmModal
        open
        title="Pubblicare l'evento?"
        message="«Veglia di preghiera — 12 ottobre» diventerà visibile a tutti i visitatori del sito."
        tone="primary"
        confirmLabel="Pubblica"
        onConfirm={noop}
        onCancel={noop}
      />
    </Stage>
  );
}

export function Loading() {
  return (
    <Stage>
      <ConfirmModal
        open
        title="Eliminare l'iscrizione?"
        message="L'iscrizione di Marco Rossi verrà rimossa dall'elenco dei partecipanti."
        loading
        loadingLabel="Eliminando..."
        onConfirm={noop}
        onCancel={noop}
      />
    </Stage>
  );
}
