import { FooterAccordion } from "chiesa-san-marco";

const linkStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  color: "color-mix(in srgb, var(--color-foreground) 70%, transparent)",
  textDecoration: "none",
};

export function Open() {
  return (
    <div style={{ maxWidth: 360 }}>
      <FooterAccordion title="La comunità" defaultOpen>
        <a style={linkStyle} href="/chi-siamo">Chi siamo</a>
        <a style={linkStyle} href="/contatti">Contatti</a>
        <a style={linkStyle} href="/eventi">Eventi</a>
      </FooterAccordion>
    </div>
  );
}

export function Closed() {
  return (
    <div style={{ maxWidth: 360 }}>
      <FooterAccordion title="Preghiera e liturgia">
        <a style={linkStyle} href="/preghiere">Preghiere</a>
        <a style={linkStyle} href="/liturgia">Liturgia</a>
      </FooterAccordion>
    </div>
  );
}

export function AStack() {
  return (
    <div style={{ maxWidth: 360 }}>
      <FooterAccordion title="La comunità" defaultOpen>
        <a style={linkStyle} href="/chi-siamo">Chi siamo</a>
        <a style={linkStyle} href="/contatti">Contatti</a>
      </FooterAccordion>
      <FooterAccordion title="Preghiera e liturgia">
        <a style={linkStyle} href="/preghiere">Preghiere</a>
        <a style={linkStyle} href="/liturgia">Liturgia</a>
      </FooterAccordion>
      <FooterAccordion title="Informazioni" isLast>
        <a style={linkStyle} href="/privacy">Privacy</a>
        <a style={linkStyle} href="/termini">Termini di servizio</a>
      </FooterAccordion>
    </div>
  );
}
