"use client";

import { openConsentPreferences } from "@/lib/consent";

export default function ManageCookiesButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="footer-link text-foreground/60"
    >
      {label}
    </button>
  );
}
