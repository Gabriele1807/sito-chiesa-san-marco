import { StatTile } from "chiesa-san-marco";
import { BellRing, CalendarDays, Users, UserPlus } from "lucide-react";

export function Default() {
  return (
    <div style={{ maxWidth: 280 }}>
      <StatTile label="Iscritti totali" value={412} detail="+18 negli ultimi 30 giorni" icon={Users} />
    </div>
  );
}

export function WithoutDetail() {
  return (
    <div style={{ maxWidth: 280 }}>
      <StatTile label="Eventi pubblicati" value={9} icon={CalendarDays} />
    </div>
  );
}

export function StringValue() {
  return (
    <div style={{ maxWidth: 280 }}>
      <StatTile label="Prossima liturgia" value="dom 05/10" detail="San Marco — ore 9:30" icon={CalendarDays} />
    </div>
  );
}

export function ARow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
      <StatTile label="Iscritti totali" value={412} detail="+18 negli ultimi 30 giorni" icon={Users} />
      <StatTile label="Nuovi questo mese" value={18} detail="su 412 registrati" icon={UserPlus} />
      <StatTile label="Eventi pubblicati" value={9} icon={CalendarDays} />
      <StatTile label="Notifiche attive" value={236} detail="dispositivi iscritti" icon={BellRing} />
    </div>
  );
}
