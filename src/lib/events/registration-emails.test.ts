import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendBookingConfirmationEmail = vi.fn<
  (params: Record<string, unknown>) => Promise<{ ok: true }>
>(async () => ({ ok: true }));
vi.mock("@/lib/email/send-email", () => ({
  sendBookingConfirmationEmail: (params: Record<string, unknown>) =>
    sendBookingConfirmationEmail(params),
  sendEventReminderEmail: vi.fn(),
}));

import {
  registrationRecipient,
  registrationEmailData,
  sendRegistrationConfirmation,
} from "./registration-emails";
import type { Evento, IscrizioneEvento } from "@/types";

const evento = { id: "e1", titolo: "Ritiro", data: "2026-10-04T09:30", luogo: "Chiesa" } as Evento;
const base = {
  eventoId: "e1",
  nome: "Maria",
  cognome: "Rossi",
  padreNome: "Luigi",
  padreCognome: "Rossi",
  telefono: "333",
  ha_pagato: false,
} as IscrizioneEvento;

describe("registration emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sanmarco.example");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("writes to the account email first, then to the form email, otherwise to nobody", () => {
    expect(
      registrationRecipient({ createdByEmail: "account@example.com", email: "form@example.com" })
    ).toBe("account@example.com");
    expect(registrationRecipient({ email: " form@example.com " })).toBe("form@example.com");
    expect(registrationRecipient({})).toBeNull();
  });

  it("lists every family member and the chosen meeting point", () => {
    const data = registrationEmailData(evento, {
      ...base,
      registrationType: "family",
      familyMembers: [
        { role: "madre", fullName: "Anna Rossi" },
        { role: "figlio", fullName: "Marco Rossi" },
      ],
      raccoglimentoPunto: { label: "Stazione", orario: "08:30" },
      emailLocale: "ar",
    });
    expect(data).toMatchObject({
      locale: "ar",
      partecipanti: ["Anna Rossi", "Marco Rossi"],
      raccolta: "Stazione · 08:30",
    });
  });

  it("does not send anything without a recipient", async () => {
    expect(await sendRegistrationConfirmation(evento, base)).toBeNull();
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("links to the user's registrations page", async () => {
    await sendRegistrationConfirmation(evento, { ...base, email: "form@example.com" });
    expect(sendBookingConfirmationEmail.mock.calls[0][0]).toMatchObject({
      to: "form@example.com",
      manageUrl: "https://sanmarco.example/iscrizioni",
      partecipanti: ["Maria Rossi"],
    });
  });
});
