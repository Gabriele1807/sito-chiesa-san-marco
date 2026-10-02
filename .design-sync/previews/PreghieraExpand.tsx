import { PreghieraExpand } from "chiesa-san-marco";

const salmo =
  "Pietà di me, o Dio, secondo la tua misericordia;\n" +
  "nella tua grande bontà cancella il mio peccato.\n" +
  "Lavami da tutte le mie colpe,\n" +
  "mondami dal mio peccato.";

export function Collapsed() {
  return (
    <div style={{ maxWidth: 440 }}>
      <PreghieraExpand testo={salmo} labelRead="Leggi la preghiera" />
    </div>
  );
}

export function ShortPrayer() {
  return (
    <div style={{ maxWidth: 440 }}>
      <PreghieraExpand
        testo={"Gloria al Padre, al Figlio e allo Spirito Santo,\nora e sempre, nei secoli dei secoli. Amen."}
        labelRead="Leggi il Gloria"
      />
    </div>
  );
}

export function InContext() {
  return (
    <div style={{ maxWidth: 440 }}>
      <h3 style={{ margin: 0, fontWeight: 700, color: "var(--color-foreground)" }}>Salmo 50</h3>
      <p style={{ margin: "4px 0 0", fontSize: 14, color: "color-mix(in srgb, var(--color-foreground) 70%, transparent)" }}>
        Il salmo penitenziale letto ogni mattina.
      </p>
      <PreghieraExpand testo={salmo} labelRead="Leggi la preghiera" />
    </div>
  );
}
