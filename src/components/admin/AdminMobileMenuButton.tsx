"use client";

import { Menu } from "lucide-react";

export default function AdminMobileMenuButton() {
  function handleClick() {
    const sidebar = document.getElementById("admin-mobile-sidebar");
    const overlay = document.getElementById("admin-sidebar-overlay");
    if (!sidebar || !overlay) return;

    const isOpen = !sidebar.classList.contains("-translate-x-full");

    if (isOpen) {
      sidebar.classList.add("-translate-x-full");
      sidebar.classList.remove("translate-x-0");
      overlay.classList.add("hidden");
      return;
    }

    sidebar.classList.remove("-translate-x-full");
    sidebar.classList.add("translate-x-0");
    overlay.classList.remove("hidden");
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
