import { BackLink } from "chiesa-san-marco";

export function Default() {
  return <BackLink href="/icone" label="Torna alle icone" />;
}

export function OnASubPage() {
  return <BackLink href="/preghiere" label="Tutte le preghiere" />;
}

export function LongLabel() {
  return <BackLink href="/liturgia/testi" label="Torna ai testi liturgici della Settimana Santa" />;
}
