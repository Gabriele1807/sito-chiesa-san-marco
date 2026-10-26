import * as React from "react";
declare const Link: React.ForwardRefExoticComponent<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string | {
        pathname?: string;
    };
    prefetch?: boolean | null;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    locale?: string | false;
} & React.RefAttributes<HTMLAnchorElement>>;
export default Link;
