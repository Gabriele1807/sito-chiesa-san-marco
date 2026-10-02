import { IconaQRSection } from "chiesa-san-marco";

// The component reads window.location.origin and renders null until it has it,
// so the card shows the QR for whatever origin the preview is served from.
export function Default() {
  return (
    <div style={{ maxWidth: 480 }}>
      <IconaQRSection slug="san-marco-evangelista" />
    </div>
  );
}

export function AnotherIcon() {
  return (
    <div style={{ maxWidth: 480 }}>
      <IconaQRSection slug="vergine-maria" />
    </div>
  );
}
