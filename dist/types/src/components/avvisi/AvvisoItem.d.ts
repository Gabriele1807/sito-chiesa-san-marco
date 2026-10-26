import type { AvvisoLevel } from "@/lib/mongo/announcements";
export interface AvvisoView {
    id: string;
    titolo: string;
    messaggio: string;
    livello: AvvisoLevel;
    link?: string;
    /** Testi già formattati nella lingua del visitatore. */
    levelLabel: string;
    meta?: string;
    linkLabel: string;
}
export declare function AvvisoLink({ href, className, children, }: {
    href: string;
    className?: string;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/** Scheda di un avviso: stessa resa in home e nella pagina /avvisi. */
export default function AvvisoItem({ avviso }: {
    avviso: AvvisoView;
}): import("react/jsx-runtime").JSX.Element;
