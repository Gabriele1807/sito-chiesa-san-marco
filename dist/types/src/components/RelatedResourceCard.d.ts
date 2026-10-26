interface RelatedResourceCardProps {
    href: string;
    tag: string;
    tagColor: "primary" | "accent";
    title: string;
    subtitle?: string;
}
export default function RelatedResourceCard({ href, tag, tagColor, title, subtitle }: RelatedResourceCardProps): import("react/jsx-runtime").JSX.Element;
export {};
