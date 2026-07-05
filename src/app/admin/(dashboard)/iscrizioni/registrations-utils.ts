export type RegistrationFilterKey = "paid" | "unpaid" | "chiesa" | "luogo";
export type RegistrationSortOption = "createdAtDesc" | "createdAtAsc" | "nomeAsc" | "nomeDesc";

export interface RegistrationListFilters {
  search: string;
  activeFilters: Set<string>;
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
  raccoglimento?: "chiesa" | "luogo";
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
    if (filters.activeFilters.has("paid") && !item.ha_pagato) return false;
    if (filters.activeFilters.has("unpaid") && item.ha_pagato) return false;
    // Support both semantic `raccoglimento` and explicit `raccoglimentoPunto` labels.
    // If a specific `raccoglimentoPunto` is present, give it priority over the stored `raccoglimento` value
    const punto = (item as any).raccoglimentoPunto;
    const hasPunto = Boolean(punto && (punto.label || "").toString().trim());
    const puntoLabel = hasPunto ? normalize((punto.label || "").toString()) : "";

    if (filters.activeFilters.has("chiesa")) {
      if (hasPunto) {
        if (!puntoLabel.includes("chiesa")) return false;
      } else {
        if (item.raccoglimento !== "chiesa") return false;
      }
    }

    if (filters.activeFilters.has("luogo")) {
      if (hasPunto) {
        if (!puntoLabel.includes("luogo")) return false;
      } else {
        if (item.raccoglimento !== "luogo") return false;
      }
    }

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
