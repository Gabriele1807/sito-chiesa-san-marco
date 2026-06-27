"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenuButton from "./MobileMenuButton";
import TopbarTitle from "./TopbarTitle";
import UserMenu from "./auth/UserMenu";
import { useTranslations } from "next-intl";

interface Props {
  locale: string;
}

export default function Navbar({ locale }: Props) {
  const t = useTranslations("common");
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateNavbarState = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      setIsAtTop(currentY < 12);

      if (currentY < 72) {
        setIsVisible(true);
      } else if (delta > 4 && currentY > 96) {
        setIsVisible(false);
      } else if (delta < -4) {
        setIsVisible(true);
      }

      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateNavbarState);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.topbarHidden = isVisible ? "false" : "true";
    }
  }, [isVisible]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
      } ${isAtTop ? "shadow-sm" : "shadow-md"}`}
    >
      <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 px-4 lg:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <MobileMenuButton />
          </div>
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo-san-marco.png"
              alt={t("logoAlt")}
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="hidden sm:inline text-sm font-display font-semibold text-foreground">
              {t("sanMarco")}
            </span>
          </Link>
        </div>

        {/* Center: current section title */}
        <div className="flex min-w-0 justify-center px-2 sm:px-4">
          <div className="w-full max-w-[18rem] min-w-0">
            <TopbarTitle className="flex min-w-0 justify-center" />
          </div>
        </div>

        {/* Right: user menu + language switch */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <UserMenu />
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
