import * as React from "react";
import { InstallAppButton, initInstallStore } from "chiesa-san-marco";

// The button hides itself unless the browser has offered installation. The
// store learns that from a real `beforeinstallprompt` event, so the preview
// initialises the store and fires one — the same path a real browser takes.
function useInstallable() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    initInstallStore();
    window.dispatchEvent(new Event("beforeinstallprompt"));
    setReady(true);
  }, []);
  return ready;
}

export function Default() {
  const ready = useInstallable();
  return <div style={{ minHeight: 24 }}>{ready ? <InstallAppButton /> : null}</div>;
}

export function InAFooterRow() {
  const ready = useInstallable();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 16px",
        borderRadius: 12,
        background: "var(--color-sidebar)",
        color: "#fff",
        fontSize: 13,
        minHeight: 24,
      }}
    >
      <span style={{ opacity: 0.7 }}>© 2026 Chiesa San Marco</span>
      {ready ? <InstallAppButton className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors" /> : null}
    </div>
  );
}
