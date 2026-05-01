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

  const switchTo: Locale = currentLocale === "it" ? "ar" : "it";
  const label = currentLocale === "it" ? t("arabo") : t("italiano");

  function handleSwitch() {
    startTransition(async () => {
      await setLocale(switchTo);
      router.refresh();
    });
  }

  /* Short code shown on mobile (xs), full label on sm+ */
  const shortCode = currentLocale === "it" ? "ع" : "IT";

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-accent hover:text-white active:bg-accent active:text-white transition-all duration-200 border border-gray-200 hover:border-accent disabled:opacity-50 cursor-pointer"
      aria-label={t("switchLanguageTo", { language: label })}
    >
      <Globe className="w-4 h-4" />
      <span className="sm:hidden">{shortCode}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
