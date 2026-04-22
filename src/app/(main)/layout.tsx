import { getLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar locale={locale} />
      <div className="flex flex-1 min-w-0 bg-sidebar pt-14">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col w-0 bg-background">
          <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 flex-1 max-w-full">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
