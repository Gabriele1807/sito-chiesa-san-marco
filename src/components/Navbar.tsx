"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenuButton from "./MobileMenuButton";
import TopbarTitle from "./TopbarTitle";
import UserMenu from "./auth/UserMenu";

interface Props {
  locale: string;
}

export default function Navbar({ locale }: Props) {
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
      } ${isAtTop ? "border-gray-100 shadow-sm" : "border-gray-200 shadow-md"}`}
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
              alt="Logo Chiesa Copta San Marco"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="hidden sm:inline text-sm font-bold text-[#0F1A2E]">San Marco</span>
          </Link>
        </div>

        {/* Center: dynamic page title */}
        <TopbarTitle />

        {/* Right: user menu + language switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <UserMenu />
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
