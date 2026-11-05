"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({
  links,
}: {
  links: { href: string; label: string; hint?: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "min-w-[7.5rem] rounded-2xl bg-deep px-3.5 py-2.5 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(47,36,28,0.12)] transition-colors duration-300"
                : "min-w-[7.5rem] rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-mint hover:bg-mint/15"
            }
          >
            <span className="block leading-5">{link.label}</span>
            {link.hint ? (
              <span className={active ? "block text-xs text-cream/70" : "block text-xs text-leaf"}>
                {link.hint}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
