import Link from "next/link";
import { cookies } from "next/headers";
import { Shield } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenuButton from "./MobileMenuButton";
import TopbarTitle from "./TopbarTitle";

interface Props {
  locale: string;
}

export default async function Navbar({ locale }: Props) {
  const cookieStore = await cookies();
  const isAdmin = !!cookieStore.get("admin_session")?.value;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <MobileMenuButton />
          </div>
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">☦</span>
            </div>
            <span className="hidden sm:inline text-sm font-bold text-primary">San Marco</span>
          </Link>
        </div>

        {/* Center: dynamic page title */}
        <TopbarTitle />

        {/* Right: admin link + language switch */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
