"use client";

import { Menu } from "lucide-react";

export default function AdminMobileMenuButton() {
  function handleClick() {
    const sidebar = document.getElementById("admin-mobile-sidebar");
    const overlay = document.getElementById("admin-sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      sidebar.classList.toggle("translate-x-0");
      overlay.classList.toggle("hidden");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer lg:hidden"
      aria-label="Apri menu admin"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
