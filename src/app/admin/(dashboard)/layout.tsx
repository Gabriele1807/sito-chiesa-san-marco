// FIX [9] — Dashboard layout with sidebar, separated from login route
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbarTitle from "@/components/admin/AdminTopbarTitle";
import AdminToast from "@/components/admin/AdminToast";
import AdminMobileMenuButton from "@/components/admin/AdminMobileMenuButton";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminSession();
  if (!adminUser) {
    redirect("/admin/login");
  }

  return (
    <>
      <AdminSidebar />

      {/* Topbar */}
      <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-14 bg-surface border-b border-border flex items-center px-4 lg:px-6 z-30 gap-3">
        <AdminMobileMenuButton />
        <AdminTopbarTitle />
      </header>

      {/* Content */}
      <main className="lg:ml-[260px] pt-14">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <AdminToast />
    </>
  );
}
