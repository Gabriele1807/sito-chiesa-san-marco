/**
 * MongoDB visibility layer — gestione della visibilità delle sezioni per ruolo.
 *
 * Collezione su Atlas: section_visibility
 */

import { getDb } from "@/lib/mongo/client";
import type { SectionVisibility, SectionRoleConfig, RoleAccessType } from "@/types";

// Flag per indici
const g = globalThis as unknown as {
  _mongoVisibilityIndexes?: boolean;
};

async function ensureIndexes(): Promise<void> {
  if (g._mongoVisibilityIndexes) return;
  const db = await getDb();
  await Promise.all([
    db.collection("section_visibility").createIndex({ sectionId: 1 }, { unique: true }),
  ]);
  g._mongoVisibilityIndexes = true;
}

// Rimuove _id MongoDB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T>(doc: any): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
}

/**
 * Configurazioni di default per le sezioni.
 * Usate per inizializzare la collezione se non esiste.
 */
export const DEFAULT_SECTIONS: Omit<SectionVisibility, "id" | "createdAt" | "updatedAt">[] = [
  {
    sectionId: "orari",
    sectionLabel: "Orari settimanali",
    isActive: true,
    roleConfig: {
      guest: "full",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
  {
    sectionId: "preghiere",
    sectionLabel: "Preghiere",
    isActive: true,
    roleConfig: {
      guest: "full",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
  {
    sectionId: "icone",
    sectionLabel: "Icone Sacre",
    isActive: true,
    roleConfig: {
      guest: "full",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
  {
    sectionId: "libreria",
    sectionLabel: "Libreria",
    isActive: true,
    roleConfig: {
      guest: "coming_soon",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
  {
    sectionId: "eventi",
    sectionLabel: "Eventi",
    isActive: true,
    roleConfig: {
      guest: "coming_soon",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
  {
    sectionId: "video-corsi",
    sectionLabel: "Video e Corsi",
    isActive: true,
    roleConfig: {
      guest: "coming_soon",
      credente: "full",
      madre: "full",
      padre: "full",
      diacono: "full",
      ospite_chiesa: "full",
      admin: "full",
      superadmin: "full",
    },
  },
];

/**
 * Inizializza la collezione section_visibility se non esiste.
 * Usata una sola volta al primo avvio.
 */
async function seedVisibilityIfEmpty(): Promise<void> {
  await ensureIndexes();
  const db = await getDb();
  const count = await db.collection("section_visibility").countDocuments();
  
  if (count === 0) {
    const now = new Date().toISOString();
    const docs = DEFAULT_SECTIONS.map((section, idx) => ({
      id: String(idx + 1),
      ...section,
      createdAt: now,
      updatedAt: now,
    }));
    await db.collection("section_visibility").insertMany(docs);
  }
}

/**
 * Legge tutte le configurazioni di visibilità delle sezioni.
 */
export async function getAllSectionVisibilities(): Promise<SectionVisibility[]> {
  await seedVisibilityIfEmpty();
  const db = await getDb();
  const docs = await db.collection("section_visibility").find({}).toArray();
  return docs.map((d) => clean<SectionVisibility>(d));
}

/**
 * Legge la configurazione di visibilità di una sezione.
 */
export async function getSectionVisibility(sectionId: string): Promise<SectionVisibility | undefined> {
  await ensureIndexes();
  const db = await getDb();
  const doc = await db.collection("section_visibility").findOne({ sectionId });
  return doc ? clean<SectionVisibility>(doc) : undefined;
}

/**
 * Aggiorna il flag globale isActive di una sezione (toggle on/off).
 * Usato dagli admin per abilitare/disabilitare rapidamente una sezione.
 */
export async function updateSectionActive(sectionId: string, isActive: boolean): Promise<SectionVisibility | null> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.collection("section_visibility").findOneAndUpdate(
    { sectionId },
    { $set: { isActive, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result ? clean<SectionVisibility>(result) : null;
}

/**
 * Aggiorna la configurazione dei permessi per ruolo di una sezione.
 * Usato dai superadmin per configurazioni avanzate.
 * MERGE: combina la nuova configurazione con quella esistente anziché sostituirla.
 */
export async function updateSectionRoleConfig(
  sectionId: string,
  roleConfig: Partial<SectionRoleConfig>
): Promise<SectionVisibility | null> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date().toISOString();
  
  // Legge il documento attuale
  const current = await db.collection("section_visibility").findOne({ sectionId });
  if (!current) return null;
  
  // Merge con la configurazione attuale (non sostituire)
  const mergedRoleConfig = {
    ...current.roleConfig,
    ...roleConfig,
  };
  
  const result = await db.collection("section_visibility").findOneAndUpdate(
    { sectionId },
    { $set: { roleConfig: mergedRoleConfig, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result ? clean<SectionVisibility>(result) : null;
}

/**
 * Aggiorna completamente una sezione (isActive + roleConfig + label).
 */
export async function updateSectionVisibility(
  sectionId: string,
  updates: Partial<Omit<SectionVisibility, "id" | "createdAt" | "updatedAt">>
): Promise<SectionVisibility | null> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.collection("section_visibility").findOneAndUpdate(
    { sectionId },
    { $set: { ...updates, updatedAt: now } },
    { returnDocument: "after" }
  );
  return result ? clean<SectionVisibility>(result) : null;
}

/**
 * Crea una nuova sezione (usato quando si aggiungono nuove sezioni dinamicamente).
 */
export async function createSectionVisibility(
  data: Omit<SectionVisibility, "id" | "createdAt" | "updatedAt">
): Promise<SectionVisibility> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date().toISOString();
  
  // Genera ID incrementale
  const existingDocs = await db
    .collection("section_visibility")
    .find({}, { projection: { id: 1 } })
    .toArray();
  const maxId = existingDocs.reduce((m, d) => Math.max(m, parseInt(d.id as string) || 0), 0);
  const newId = String(maxId + 1);
  
  const newSection: SectionVisibility = {
    id: newId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.collection("section_visibility").insertOne({ ...newSection });
  return newSection;
}

/**
 * Determina l'accesso di un ruolo a una sezione specifica.
 * Ritorna:
 *   "full" -> accesso completo
 *   "coming_soon" -> mostra coming soon
 *   "hidden" -> nessun accesso / non renderizzare
 */
export async function getRoleAccessToSection(
  sectionId: string,
  role: "guest" | "credente" | "madre" | "padre" | "diacono" | "ospite_chiesa" | "prete" | "admin" | "superadmin"
): Promise<RoleAccessType> {
  const visibility = await getSectionVisibility(sectionId);
  
  // Se la sezione è globalmente disabilitata, nessuno ha accesso
  if (!visibility?.isActive) {
    return "hidden";
  }
  
  // Controlla la configurazione per il ruolo specifico
  const access = visibility?.roleConfig?.[role];
  return access || "hidden";
}
