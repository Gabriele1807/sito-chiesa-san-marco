"use client";

import GuestGate from "@/components/auth/GuestGate";

/**
 * Wrapper per pagine che richiedono autenticazione.
 * Usabile in server components come children wrapper.
 */
export default function RestrictedSection({
  children,
  message,
}: {
  children: React.ReactNode;
  message?: string;
}) {
  return <GuestGate message={message}>{children}</GuestGate>;
}
