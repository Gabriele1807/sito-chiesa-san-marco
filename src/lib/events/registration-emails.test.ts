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

  it("writes only to the account email, never to the address typed in the form", () => {
    expect(registrationRecipient({ createdByEmail: " account@example.com " })).toBe(
      "account@example.com"
    );
    expect(registrationRecipient({ createdByEmail: undefined })).toBeNull();
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

  it("ignores the form email and links to the user's registrations page", async () => {
    expect(
      await sendRegistrationConfirmation(evento, { ...base, email: "form@example.com" })
    ).toBeNull();
    await sendRegistrationConfirmation(evento, {
      ...base,
      email: "form@example.com",
      createdByEmail: "account@example.com",
    });
    expect(sendBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(sendBookingConfirmationEmail.mock.calls[0][0]).toMatchObject({
      to: "account@example.com",
      manageUrl: "https://sanmarco.example/iscrizioni",
      partecipanti: ["Maria Rossi"],
    });
  });
});
