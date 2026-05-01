// FIX [9] — Simplified admin layout: sidebar/topbar moved to (dashboard)/layout.tsx
// so /admin/login renders without sidebar
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-alt">
      {children}
    </div>
  );
}
