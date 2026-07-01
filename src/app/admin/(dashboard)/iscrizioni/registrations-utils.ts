export type RegistrationPaymentFilter = "all" | "pagato" | "non-pagato";
export type RegistrationSortOption = "createdAtDesc" | "createdAtAsc" | "nomeAsc" | "nomeDesc";

export interface RegistrationListFilters {
  search: string;
  paymentFilter: RegistrationPaymentFilter;
  sortBy: RegistrationSortOption;
}

export interface RegistrationSummary {
  totali: number;
  pagati: number;
  nonPagati: number;
}

export interface RegistrationLike {
  _id: string;
  nome: string;
  cognome: string;
  padreNome: string;
  padreCognome: string;
  telefono: string;
  email?: string;
  ha_pagato: boolean;
  createdAt?: string;
}

function normalize(value: string): string {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildRegistrationSummary(registrations: RegistrationLike[]): RegistrationSummary {
  return {
    totali: registrations.length,
    pagati: registrations.filter((item) => item.ha_pagato).length,
    nonPagati: registrations.filter((item) => !item.ha_pagato).length,
  };
}

export function filterAndSortRegistrations<T extends RegistrationLike>(
  registrations: T[],
  filters: RegistrationListFilters
): T[] {
  const q = normalize(filters.search);

  const filtered = registrations.filter((item) => {
    if (filters.paymentFilter === "pagato" && !item.ha_pagato) return false;
    if (filters.paymentFilter === "non-pagato" && item.ha_pagato) return false;

    if (!q) return true;

    const haystack = normalize(
      `${item.nome} ${item.cognome} ${item.padreNome} ${item.padreCognome} ${item.telefono} ${item.email ?? ""}`
    );
    return haystack.includes(q);
  });

  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "createdAtAsc":
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      case "nomeAsc":
        return `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`, "it", { sensitivity: "base" });
      case "nomeDesc":
        return `${b.nome} ${b.cognome}`.localeCompare(`${a.nome} ${a.cognome}`, "it", { sensitivity: "base" });
      case "createdAtDesc":
      default:
        return (b.createdAt || "").localeCompare(a.createdAt || "");
    }
  });
}
