"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setLocale } from "@/lib/actions";
import type { Locale } from "@/types";

interface Props {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const switchTo: Locale = currentLocale === "it" ? "ar" : "it";
  const label = currentLocale === "it" ? "العربية" : "Italiano";

  function handleSwitch() {
    startTransition(async () => {
      await setLocale(switchTo);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-accent hover:text-white transition-all duration-200 border border-gray-200 hover:border-accent disabled:opacity-50 cursor-pointer"
      aria-label={`Switch language to ${label}`}
    >
      <Globe className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
