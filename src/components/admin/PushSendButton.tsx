"use client";

import { useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin/fetch-with-auth-redirect";
import { showToast } from "@/components/admin/AdminToast";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Props {
  avvisoId: string;
  titolo: string;
  pushSentAt?: string;
  /** Avviso non visibile (bozza, programmato, scaduto): invio non consentito. */
  inactive: boolean;
  configured: boolean;
  subscribers: number;
  onSent: () => void;
}

/** Invia a tutti i dispositivi iscritti la notifica push di un avviso. */
export default function PushSendButton({
  avvisoId,
  titolo,
  pushSentAt,
  inactive,
  configured,
  subscribers,
  onSent,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const disabledReason = !configured
    ? "Notifiche non configurate (chiavi VAPID mancanti)"
    : inactive
      ? "Solo gli avvisi visibili sul sito possono essere inviati"
      : subscribers === 0
        ? "Nessun dispositivo iscritto alle notifiche"
        : null;

  async function send() {
    setSending(true);
    try {
      const res = await adminFetch("/api/admin/avvisi/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: avvisoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Invio non riuscito", "error");
        return;
      }
      showToast(
        `Notifica inviata a ${data.sent} dispositivi${data.failed ? ` (${data.failed} non raggiunti)` : ""}`,
        data.sent > 0 ? "success" : "error"
      );
      onSent();
    } catch {
      showToast("Errore di connessione", "error");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  const sentBefore = pushSentAt
    ? ` Attenzione: è già stata inviata il ${new Date(pushSentAt).toLocaleString("it-IT", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}.`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={Boolean(disabledReason) || sending}
        title={
          disabledReason ??
          (pushSentAt ? "Notifica già inviata: invia di nuovo" : "Invia notifica push")
        }
        className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
          pushSentAt ? "text-success hover:bg-success/10" : "text-gold hover:bg-gold/10"
        }`}
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
      </button>
      <ConfirmModal
        open={confirming}
        title="Inviare la notifica?"
        message={`"${titolo}" arriverà come notifica su ${subscribers} dispositivi iscritti.${sentBefore}`}
        confirmLabel="Invia notifica"
        loadingLabel="Invio in corso..."
        tone="primary"
        loading={sending}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
