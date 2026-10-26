import { QuickAccessCard } from "chiesa-san-marco";
import { BookOpen, CalendarDays, HandHeart, Images } from "lucide-react";

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <QuickAccessCard
        href="/preghiere"
        icon={HandHeart}
        title="Preghiere"
        description="Le preghiere quotidiane della tradizione copta, in italiano e in arabo."
      />
    </div>
  );
}

export function Highlighted() {
  return (
    <div style={{ maxWidth: 320 }}>
      <QuickAccessCard
        href="/eventi"
        icon={CalendarDays}
        title="Eventi"
        description="Iscriviti alle celebrazioni e agli incontri della comunità."
        highlight
      />
    </div>
  );
}

export function WithBadge() {
  return (
    <div style={{ maxWidth: 320 }}>
      <QuickAccessCard
        href="/liturgia"
        icon={BookOpen}
        title="Liturgia"
        description="Testi e letture per seguire la Divina Liturgia."
        badge="Nuovo"
      />
    </div>
  );
}

export function ComingSoon() {
  return (
    <div style={{ maxWidth: 320 }}>
      <QuickAccessCard
        href="/galleria"
        icon={Images}
        title="Galleria"
        description="Le icone e le fotografie della chiesa."
        comingSoon
      />
    </div>
  );
}

export function AGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
      <QuickAccessCard href="/preghiere" icon={HandHeart} title="Preghiere" description="Le preghiere quotidiane della tradizione copta." />
      <QuickAccessCard href="/eventi" icon={CalendarDays} title="Eventi" description="Iscriviti alle celebrazioni della comunità." highlight />
      <QuickAccessCard href="/liturgia" icon={BookOpen} title="Liturgia" description="Testi e letture della Divina Liturgia." badge="Nuovo" />
      <QuickAccessCard href="/galleria" icon={Images} title="Galleria" description="Le icone e le fotografie della chiesa." comingSoon />
    </div>
  );
}
