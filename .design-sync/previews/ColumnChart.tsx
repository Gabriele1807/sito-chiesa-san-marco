import { ColumnChart } from "chiesa-san-marco";

const months = [
  { label: "apr", fullLabel: "aprile 2026", value: 24 },
  { label: "mag", fullLabel: "maggio 2026", value: 31 },
  { label: "giu", fullLabel: "giugno 2026", value: 28 },
  { label: "lug", fullLabel: "luglio 2026", value: 19 },
  { label: "ago", fullLabel: "agosto 2026", value: 12 },
  { label: "set", fullLabel: "settembre 2026", value: 44 },
];

export function Default() {
  return (
    <div style={{ maxWidth: 520 }}>
      <ColumnChart title="Nuove registrazioni per mese" unit="registrazioni" data={months} />
    </div>
  );
}

export function FewColumns() {
  return (
    <div style={{ maxWidth: 520 }}>
      <ColumnChart
        title="Iscrizioni per fascia oraria"
        unit="iscrizioni"
        data={[
          { label: "9:30", fullLabel: "Liturgia delle 9:30", value: 186 },
          { label: "11:30", fullLabel: "Liturgia delle 11:30", value: 142 },
          { label: "18:00", fullLabel: "Vespro delle 18:00", value: 64 },
        ]}
      />
    </div>
  );
}
