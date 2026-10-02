import { UrgentAvvisiBanner } from "chiesa-san-marco";

export function Default() {
  return (
    <UrgentAvvisiBanner
      avvisi={[
        {
          key: "avviso-1-2026-09-30",
          titolo: "Liturgia spostata",
          messaggio: "Domenica 5 ottobre la Liturgia delle 9:30 si terrà nella cappella inferiore.",
        },
      ]}
    />
  );
}

export function WithLink() {
  return (
    <UrgentAvvisiBanner
      avvisi={[
        {
          key: "avviso-2-2026-09-28",
          titolo: "Iscrizioni aperte",
          messaggio: "Sono aperte le iscrizioni al pellegrinaggio annuale dell'8 novembre.",
          link: "/eventi/pellegrinaggio",
        },
      ]}
    />
  );
}

export function Multiple() {
  return (
    <UrgentAvvisiBanner
      avvisi={[
        {
          key: "avviso-1-2026-09-30",
          titolo: "Liturgia spostata",
          messaggio: "Domenica 5 ottobre la Liturgia delle 9:30 si terrà nella cappella inferiore.",
        },
        {
          key: "avviso-2-2026-09-28",
          titolo: "Iscrizioni aperte",
          messaggio: "Sono aperte le iscrizioni al pellegrinaggio annuale dell'8 novembre.",
          link: "/eventi/pellegrinaggio",
        },
      ]}
    />
  );
}
