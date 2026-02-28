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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar locale={locale} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="px-6 sm:px-8 lg:px-10 py-10 flex-1 w-full">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
