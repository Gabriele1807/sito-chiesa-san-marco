"use client";

import SidebarDock from "@/components/sidebar/SidebarDock";
import MobileDock from "@/components/sidebar/MobileDock";
import { SidebarProvider } from "@/components/sidebar/SidebarContext";

export default function Sidebar() {
  return (
    <>
      <SidebarDock />
      <MobileDock />
    </>
  );
}
