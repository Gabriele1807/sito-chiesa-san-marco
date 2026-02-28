"use client";

import { Menu } from "lucide-react";

export default function MobileMenuButton() {
  function handleClick() {
    // Toggle sidebar visibility
    const sidebar = document.getElementById("mobile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      sidebar.classList.toggle("translate-x-0");
      overlay.classList.toggle("hidden");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
      aria-label="Apri menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
