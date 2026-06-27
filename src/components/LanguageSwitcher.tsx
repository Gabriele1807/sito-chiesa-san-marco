"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
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

  return (
    <label className="relative flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1.5 text-[11px] font-semibold text-foreground shadow-sm">
      <Globe className="w-4 h-4" />
      <span className="sr-only">{t("switchLanguageTo", { language: currentLocale === "it" ? t("arabo") : t("italiano") })}</span>
      <select
        value={currentLocale}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={isPending}
        className="min-w-[3.5rem] max-w-[5.5rem] appearance-none bg-transparent pr-5 text-[11px] font-semibold text-foreground outline-none disabled:opacity-50"
        aria-label={t("switchLanguageTo", { language: currentLocale === "it" ? t("arabo") : t("italiano") })}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-foreground/50">▼</span>
    </label>
  );
}
