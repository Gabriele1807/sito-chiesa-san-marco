import { type ReactNode } from "react";
interface SidebarContextValue {
    isMobileOpen: boolean;
    openMobile: () => void;
    closeMobile: () => void;
    toggleMobile: () => void;
    isCompact: boolean;
    toggleCompact: () => void;
}
export declare function SidebarProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useSidebar(): SidebarContextValue;
export {};
