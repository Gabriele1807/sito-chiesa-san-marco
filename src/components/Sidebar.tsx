"use client";

import SidebarDock from "@/components/sidebar/SidebarDock";
import MobileDock from "@/components/sidebar/MobileDock";

export default function Sidebar() {
  return (
    <>
      <SidebarDock />
      <MobileDock />
    </>
  );
}
