"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { setLocale } from "@/lib/actions";
import type { Locale } from "@/types";

interface Props {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const options: { value: Locale; label: string }[] = [
    { value: "it", label: t("italiano") },
    { value: "ar", label: t("arabo") },
  ];

  function handleSwitch(nextLocale: string) {
    if (nextLocale === currentLocale) return;
    startTransition(async () => {
      await setLocale(nextLocale as Locale);
      router.refresh();
    });
  }

  const current = options.find((option) => option.value === currentLocale) ?? options[0];
  const switchLabel = t("switchLanguageTo", {
    language: currentLocale === "it" ? t("arabo") : t("italiano"),
  });

  // Su telefono la pillola mostra solo il codice della lingua ("IT" / "ع"):
  // il nome intero toglieva spazio al titolo della sezione. Il <select>
  // nativo, trasparente, copre tutta la pillola e apre il selettore di sistema.
  return (
    <label
      className={`relative flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-2 focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-background sm:px-3 ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      <span aria-hidden className="sm:hidden">
        {current.value === "ar" ? "ع" : "IT"}
      </span>
      <span aria-hidden className="hidden sm:inline">
        {current.label}
      </span>
      <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-foreground/50 sm:block" aria-hidden />
      <select
        value={currentLocale}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={isPending}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-wait"
        aria-label={switchLabel}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
