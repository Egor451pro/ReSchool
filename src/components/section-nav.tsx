"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SectionNav({ links }: { links: { href: string; label: string }[] }) {
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
                ? "rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-ink"
                : "rounded-full bg-mint/35 px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint/70"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
