"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Link2, AlertTriangle } from "lucide-react";
import { GoogleIcon, FacebookIcon } from "@/components/auth/ProviderIcons";

type Provider = "google" | "facebook";

interface Status {
  hasPassword: boolean;
  identities: { provider: Provider; linkedAt: string; providerEmail?: string }[];
}

const PROVIDERS: { id: Provider; label: string; Icon: typeof GoogleIcon }[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
];

export default function LinkedAccountsSection() {
  const t = useTranslations("profilo");
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Provider | null>(null);
  const [confirmingUnlink, setConfirmingUnlink] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/oauth/status");
      const data = await res.json();
      if (data.success) setStatus(data);
    } catch {
      // silenzioso: la sezione mostra semplicemente "non disponibile"
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleConnect(provider: Provider) {
    setActionLoading(provider);
    window.location.href = `/api/auth/oauth/${provider}/start?intent=link&returnTo=/profilo`;
  }

  async function handleUnlink(provider: Provider) {
    setActionLoading(provider);
    setError("");
    try {
      const res = await fetch("/api/auth/oauth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
      } else {
        setError(data.error || t("linkedAccountsError"));
      }
    } catch {
      setError(t("linkedAccountsError"));
    } finally {
      setActionLoading(null);
      setConfirmingUnlink(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse">
        <div className="h-4 w-40 bg-surface-2 rounded mb-3" />
        <div className="h-10 w-full bg-surface-2 rounded" />
      </div>
    );
  }

  const totalMethods = (status?.hasPassword ? 1 : 0) + (status?.identities.length ?? 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-foreground mb-1">{t("linkedAccountsTitle")}</h3>
      <p className="text-sm text-foreground/60 mb-4">{t("linkedAccountsSubtitle")}</p>

      {error && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {PROVIDERS.map(({ id, label, Icon }) => {
          const identity = status?.identities.find((i) => i.provider === id);
          const isConnected = Boolean(identity);
          const isLast = isConnected && totalMethods <= 1;

          return (
            <div
              key={id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-foreground/60 flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-success" />
                        {t("linkedAccountsConnected")}
                        {identity && ` · ${t("linkedAccountsLinkedOn", { date: new Date(identity.linkedAt).toLocaleDateString() })}`}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-foreground/40" />
                        {t("linkedAccountsNotConnected")}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {isConnected ? (
                confirmingUnlink === id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUnlink(id)}
                      disabled={actionLoading === id}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      {t("linkedAccountsDisconnect")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingUnlink(null)}
                      className="text-xs text-foreground/60 hover:underline"
                    >
                      {t("annulla")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      isLast ? setError(t("linkedAccountsLastMethod")) : setConfirmingUnlink(id)
                    }
                    disabled={actionLoading !== null}
                    className="shrink-0 text-xs font-semibold text-foreground/70 hover:text-danger transition-colors border border-border rounded-lg px-3 py-1.5"
                  >
                    {t("linkedAccountsDisconnect")}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(id)}
                  disabled={actionLoading !== null}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline border border-accent/30 rounded-lg px-3 py-1.5 disabled:opacity-60"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {t("linkedAccountsConnect")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
