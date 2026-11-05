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
                ? "min-w-[7.5rem] rounded-xl bg-gold px-3 py-2 text-sm font-medium text-ink"
                : "min-w-[7.5rem] rounded-xl bg-mint/35 px-3 py-2 text-sm font-medium text-ink hover:bg-mint/70"
            }
          >
            <span className="block leading-5">{link.label}</span>
            {link.hint ? (
              <span className={active ? "block text-xs text-ink/70" : "block text-xs text-leaf"}>
                {link.hint}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
