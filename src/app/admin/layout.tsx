import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbarTitle from "@/components/admin/AdminTopbarTitle";
import AdminToast from "@/components/admin/AdminToast";
import AdminMobileMenuButton from "@/components/admin/AdminMobileMenuButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />

      {/* Topbar */}
      <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 z-30 gap-3">
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
    </div>
  );
}
