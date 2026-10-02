// Preview/design-runtime provider for the Chiesa San Marco component library.
//
// Three contexts the components read, all of which throw when absent:
//  - next-intl   — useTranslations()/useLocale(); Italian is the site's
//                  primary locale, so designs render the real it.json copy.
//  - AuthProvider — useAuth(). Its session fetch cannot reach an API here, so
//                  it settles on "guest", which is the state the gate
//                  components are meant to show.
//  - SidebarProvider — useSidebar(), read by the mobile menu trigger.
import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SidebarProvider } from "@/components/sidebar/SidebarContext";
import messages from "../../src/messages/it.json";

export function DsPreviewProvider({ children }: { children?: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="it" messages={messages} timeZone="Europe/Rome">
      <AuthProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

export default DsPreviewProvider;
