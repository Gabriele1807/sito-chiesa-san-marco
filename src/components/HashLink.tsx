"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type Props = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for next/link that also works for links pointing at an
 * in-page anchor (e.g. "/#orari"). Next's router only scrolls to the hash
 * target on an actual navigation, so clicking such a link while already on
 * the target page/hash is a no-op. This intercepts that case and scrolls
 * manually; any link without a "#" (or pointing at a different page) falls
 * through to normal Link/router navigation.
 */
export default function HashLink({ href, onClick, ...props }: Props) {
  const pathname = usePathname();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;

    const hrefStr = href.toString();
    const hashIndex = hrefStr.indexOf("#");
    if (hashIndex === -1) return;

    const targetPath = hrefStr.slice(0, hashIndex) || "/";
    const id = hrefStr.slice(hashIndex + 1);
    if (!id || pathname !== targetPath) return;

    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `${targetPath}#${id}`);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
