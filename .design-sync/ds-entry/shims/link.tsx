// Design-runtime stand-in for `next/link`.
// claude.ai/design renders outside a Next.js app router, where the real
// next/link has no router context. It renders a plain anchor, which is what
// next/link produces in the DOM anyway, so cards and generated designs are
// visually identical.
import * as React from "react";

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  locale?: string | false;
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch, replace, scroll, shallow, passHref, locale, ...rest },
  ref,
) {
  const url = typeof href === "string" ? href : (href?.pathname ?? "#");
  return <a ref={ref} href={url} {...rest} />;
});

export default Link;
