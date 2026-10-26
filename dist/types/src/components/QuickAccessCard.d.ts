import type { LucideIcon } from "lucide-react";
interface QuickAccessCardProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    highlight?: boolean;
    badge?: string;
    delay?: number;
    comingSoon?: boolean;
}
export default function QuickAccessCard({ href, icon: Icon, title, description, highlight, badge, delay, comingSoon }: QuickAccessCardProps): import("react/jsx-runtime").JSX.Element;
export {};
