import "./process-shim";

// Hand-written design-system entry for claude.ai/design.
// The app is a Next.js site, not a published component package, so this barrel
// is the design system's public surface: the presentational components that are
// reusable outside their page context. Feature components wired to MongoDB,
// the auth session or server-only APIs are deliberately excluded.

// -- Preview/design runtime provider (not a design-system component)
export { DsPreviewProvider } from "./provider";

// -- Navigation
export { default as BackLink } from "@/components/BackLink";

// -- Cards & surfaces
export { default as QuickAccessCard } from "@/components/QuickAccessCard";
export { default as RelatedResourceCard } from "@/components/RelatedResourceCard";

// -- Disclosure
export { FooterAccordion } from "@/components/FooterAccordion";
export { default as PreghieraExpand } from "@/components/PreghieraExpand";

// -- Feedback & overlays
export { default as ConfirmModal } from "@/components/admin/ConfirmModal";
export { default as AdminToast, showToast } from "@/components/admin/AdminToast";

// -- Data display
export { default as StatTile } from "@/components/admin/charts/StatTile";
export { default as BarList } from "@/components/admin/charts/BarList";
export { default as ColumnChart } from "@/components/admin/charts/ColumnChart";
export { default as EventRegistrations } from "@/components/admin/charts/EventRegistrations";

// -- Brand marks
export { GoogleIcon, FacebookIcon } from "@/components/auth/ProviderIcons";

// -- Content
export { default as LegalDocument } from "@/components/legal/LegalDocument";
export { default as ScrollDownHint } from "@/components/ScrollDownHint";
export { default as MobileMenuButton } from "@/components/MobileMenuButton";
export { default as IconaQRSection } from "@/components/IconaQRSection";
export { default as YouTubeLiveSection } from "@/components/YouTubeLiveSection";

// -- Banners & gates
export { default as UrgentAvvisiBanner } from "@/components/avvisi/UrgentAvvisiBanner";
export { default as GuestGate } from "@/components/auth/GuestGate";
export { default as AdminGate } from "@/components/auth/AdminGate";

// -- PWA & account
export { default as IosInstallSteps } from "@/components/pwa/IosInstallSteps";
export { default as InstallAppButton } from "@/components/pwa/InstallAppButton";
export { default as NotificationPrompt } from "@/components/pwa/NotificationPrompt";
export { default as PushToggle } from "@/components/pwa/PushToggle";
export { default as EmailVerificationStatus } from "@/components/profile/EmailVerificationStatus";

// -- PWA install store (not a component; the install-aware components read it,
//    and previews need it initialised to show their enabled state).
export { initInstallStore, canOfferInstall, useInstallState } from "@/components/pwa/install-store";
