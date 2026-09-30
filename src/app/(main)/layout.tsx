import { getLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/sidebar/SidebarContext";
import UrgentAvvisiBanner from "@/components/avvisi/UrgentAvvisiBanner";
import EmailVerifyBanner from "@/components/auth/EmailVerifyBanner";
import OAuthNoticeBanner from "@/components/auth/OAuthNoticeBanner";
import { getActiveAvvisi } from "@/lib/db";
import { localizeAvviso } from "@/lib/mongo/announcements";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, avvisi] = await Promise.all([getLocale(), getActiveAvvisi()]);
  const urgenti = avvisi
    .filter((a) => a.livello === "urgente")
    .map((a) => ({ key: `${a.id}:${a.updatedAt}`, link: a.link || undefined, ...localizeAvviso(a, locale) }));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        <Navbar locale={locale} />
        <div className="main-shell flex flex-1 min-w-0 bg-background pt-14">
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col w-0 bg-background">
            <div className="px-3 py-6 sm:px-6 sm:py-10 lg:px-10 flex-1 max-w-full">
              {urgenti.length > 0 && <UrgentAvvisiBanner avvisi={urgenti} />}
              <OAuthNoticeBanner />
              <EmailVerifyBanner />
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
