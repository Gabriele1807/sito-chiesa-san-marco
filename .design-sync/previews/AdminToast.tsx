import * as React from "react";
import { AdminToast, showToast } from "chiesa-san-marco";

// AdminToast is imperative: it paints nothing until showToast() pushes a
// message, and each message clears itself after 3s. The previews re-fire on an
// interval so the toast is on screen whenever the card is viewed, and stage it
// in a positioned box because the stack is `fixed bottom-6 right-6`.
function Stage({ text, kind }: { text: string; kind: "success" | "error" }) {
  React.useEffect(() => {
    showToast(text, kind);
    const id = setInterval(() => showToast(text, kind), 1200);
    return () => clearInterval(id);
  }, [text, kind]);

  return (
    <div
      style={{
        position: "relative",
        transform: "translateZ(0)",
        height: 160,
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        overflow: "hidden",
      }}
    >
      <AdminToast />
    </div>
  );
}

export function Success() {
  return <Stage text="Avviso pubblicato correttamente" kind="success" />;
}

export function Error() {
  return <Stage text="Impossibile salvare: controlla la connessione" kind="error" />;
}
