import { LegalDocument } from "chiesa-san-marco";

const privacy = {
  eyebrow: "Informativa",
  title: "Privacy policy",
  updatedLabel: "Ultimo aggiornamento",
  intro:
    "Questa informativa spiega quali dati raccogliamo quando usi il sito della Chiesa Copta Ortodossa di San Marco, perché li raccogliamo e per quanto tempo li conserviamo.",
  tocTitle: "In questa pagina",
  languageNotice:
    "In caso di discordanza fra la versione italiana e quella araba, prevale il testo italiano.",
  sections: [
    {
      id: "titolare",
      title: "Titolare del trattamento",
      paragraphs: [
        "Il titolare del trattamento è la Chiesa Copta Ortodossa di San Marco, con sede in Milano.",
        "Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere all'indirizzo indicato nella pagina Contatti.",
      ],
    },
    {
      id: "dati",
      title: "Dati che raccogliamo",
      paragraphs: ["Raccogliamo soltanto i dati necessari ai servizi che richiedi:"],
      items: [
        "Nome, cognome e indirizzo email, quando crei un account.",
        "I dati dell'iscrizione, quando ti iscrivi a un evento.",
        "Il token di notifica del browser, se attivi gli avvisi push.",
      ],
    },
    {
      id: "conservazione",
      title: "Per quanto tempo li conserviamo",
      paragraphs: [
        "I dati dell'account restano finché non chiedi la cancellazione. Le iscrizioni agli eventi sono conservate per dodici mesi dalla data dell'evento.",
      ],
    },
    {
      id: "diritti",
      title: "I tuoi diritti",
      paragraphs: [
        "Puoi chiedere in ogni momento di accedere ai tuoi dati, correggerli o cancellarli, e di revocare il consenso alle notifiche.",
      ],
    },
  ],
  related: { href: "/termini", label: "Leggi i Termini di servizio" },
};

export function Privacy() {
  return <LegalDocument copy={privacy} updatedAt="2026-09-14" locale="it" />;
}

export function Short() {
  return (
    <LegalDocument
      copy={{
        ...privacy,
        title: "Termini di servizio",
        eyebrow: "Condizioni",
        intro: "Usando il sito accetti le condizioni descritte qui sotto.",
        languageNotice: undefined,
        sections: privacy.sections.slice(0, 2),
        related: { href: "/privacy", label: "Leggi la Privacy policy" },
      }}
      updatedAt="2026-09-14"
      locale="it"
    />
  );
}
