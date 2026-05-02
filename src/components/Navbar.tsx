"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const navLinks = [
    { href: "/orari", key: "orari" },
    { href: "/eventi", key: "eventi" },
    { href: "/libreria", key: "libreria" },
    { href: "/icone", key: "icone" },
    { href: "/contatti", key: "contatti" },
  ] as const;

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
      } ${isAtTop ? "shadow-sm" : "shadow-md"}`}
    >
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
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

        {/* Center: desktop nav / mid-size title */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-alt/70 px-2 py-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-background"
                }`}
              >
                {tNav(link.key as Parameters<typeof tNav>[0])}
              </Link>
            );
          })}
        </nav>
        <TopbarTitle className="hidden sm:flex lg:hidden" />

        {/* Right: user menu + language switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <UserMenu />
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
