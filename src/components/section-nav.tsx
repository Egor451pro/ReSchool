"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({
  links,
}: {
  links: { href: string; label: string; hint?: string }[];
}) {
  const pathname = usePathname();

  const activeHref = links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav className="section-nav" aria-label="Разделы">
      {links.map((link) => {
        const active = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "panel-accent shrink-0 snap-start rounded-2xl px-3 py-2 text-sm font-medium shadow-[0_8px_20px_rgba(47,36,28,0.12)] transition-colors duration-300 sm:min-w-[7.5rem] sm:px-3.5 sm:py-2.5"
                : "shrink-0 snap-start rounded-2xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors duration-300 hover:border-mint hover:bg-mint/15 sm:min-w-[7.5rem] sm:px-3.5 sm:py-2.5"
            }
          >
            <span className="block leading-5">{link.label}</span>
            {link.hint ? (
              <span
                className={
                  active
                    ? "panel-accent-muted mt-0.5 hidden text-xs sm:block"
                    : "mt-0.5 hidden text-xs text-leaf sm:block"
                }
              >
                {link.hint}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
