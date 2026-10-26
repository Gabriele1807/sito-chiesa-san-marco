import { RelatedResourceCard } from "chiesa-san-marco";

export function Default() {
  return (
    <div style={{ maxWidth: 360 }}>
      <RelatedResourceCard
        href="/preghiere/salmo-50"
        tag="Preghiera"
        tagColor="accent"
        title="Salmo 50"
        subtitle="Pietà di me, o Dio, secondo la tua misericordia."
      />
    </div>
  );
}

export function PrimaryTag() {
  return (
    <div style={{ maxWidth: 360 }}>
      <RelatedResourceCard
        href="/liturgia/ore"
        tag="Liturgia"
        tagColor="primary"
        title="Liturgia delle Ore"
        subtitle="I sette tempi di preghiera della giornata copta."
      />
    </div>
  );
}

export function WithoutSubtitle() {
  return (
    <div style={{ maxWidth: 360 }}>
      <RelatedResourceCard href="/icone/san-marco" tag="Icona" tagColor="accent" title="San Marco Evangelista" />
    </div>
  );
}

export function AList() {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <RelatedResourceCard href="/preghiere/salmo-50" tag="Preghiera" tagColor="accent" title="Salmo 50" subtitle="Pietà di me, o Dio, secondo la tua misericordia." />
      <RelatedResourceCard href="/liturgia/ore" tag="Liturgia" tagColor="primary" title="Liturgia delle Ore" subtitle="I sette tempi di preghiera della giornata copta." />
      <RelatedResourceCard href="/icone/san-marco" tag="Icona" tagColor="accent" title="San Marco Evangelista" subtitle="L'icona custodita nella navata centrale." />
    </div>
  );
}
