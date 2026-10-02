import { EventRegistrations } from "chiesa-san-marco";

export function Default() {
  return (
    <div style={{ maxWidth: 560 }}>
      <EventRegistrations
        events={[
          { id: "1", titolo: "Veglia di preghiera", data: "2026-10-12", persone: 120, iscrizioni: 86, pagate: 61, postiDisponibili: 34, passato: false },
          { id: "2", titolo: "Catechesi per i giovani", data: "2026-10-19", persone: 60, iscrizioni: 44, pagate: 44, postiDisponibili: 16, passato: false },
          { id: "3", titolo: "Festa di San Marco", data: "2026-09-21", persone: 200, iscrizioni: 193, pagate: 180, postiDisponibili: 7, passato: true },
        ]}
      />
    </div>
  );
}

export function SingleEvent() {
  return (
    <div style={{ maxWidth: 560 }}>
      <EventRegistrations
        events={[
          { id: "1", titolo: "Pellegrinaggio annuale", data: "2026-11-08", persone: 80, iscrizioni: 52, pagate: 30, postiDisponibili: 28, passato: false },
        ]}
      />
    </div>
  );
}

export function FullyBooked() {
  return (
    <div style={{ maxWidth: 560 }}>
      <EventRegistrations
        events={[
          { id: "1", titolo: "Ritiro spirituale d'Avvento", data: "2026-12-06", persone: 50, iscrizioni: 50, pagate: 50, postiDisponibili: 0, passato: false },
          { id: "2", titolo: "Incontro delle famiglie", data: "2026-12-13", persone: 90, iscrizioni: 71, pagate: 38, postiDisponibili: 19, passato: false },
        ]}
      />
    </div>
  );
}
