import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import VerifyEmailPanel from "@/components/auth/VerifyEmailPanel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verificaEmail");
  // Pagina di servizio raggiunta solo dal link nell'email: non va indicizzata.
  return {
    title: t("titolo"),
    description: t("descrizione"),
    robots: { index: false, follow: false },
  };
}

export default async function VerificaEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-6">
      <VerifyEmailPanel token={typeof token === "string" ? token : ""} />
    </div>
  );
}
