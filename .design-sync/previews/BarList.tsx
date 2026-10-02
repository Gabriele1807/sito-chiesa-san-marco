import { BarList } from "chiesa-san-marco";

export function Default() {
  return (
    <div style={{ maxWidth: 440 }}>
      <BarList
        unit="persone"
        data={[
          { label: "0–13 anni", value: 48 },
          { label: "14–25 anni", value: 96 },
          { label: "26–40 anni", value: 134 },
          { label: "41–60 anni", value: 87 },
          { label: "Oltre 60", value: 47 },
        ]}
      />
    </div>
  );
}

export function ShortList() {
  return (
    <div style={{ maxWidth: 440 }}>
      <BarList
        unit="iscrizioni"
        data={[
          { label: "Italiano", value: 268 },
          { label: "Arabo", value: 144 },
        ]}
      />
    </div>
  );
}

export function WideSpread() {
  return (
    <div style={{ maxWidth: 440 }}>
      <BarList
        unit="persone"
        data={[
          { label: "Milano", value: 254 },
          { label: "Sesto San Giovanni", value: 61 },
          { label: "Monza", value: 38 },
          { label: "Altro", value: 9 },
        ]}
      />
    </div>
  );
}
