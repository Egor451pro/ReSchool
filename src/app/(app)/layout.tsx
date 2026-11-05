import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AccountHistorySync } from "@/components/account-history-sync";
import { AuthHeader } from "@/components/auth-header";
import { SectionNav } from "@/components/section-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome, sectionsForRole } from "@/domain/access/roles";
import { requireUser } from "@/server/auth/current-user";

export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-leaf">Открываем раздел…</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const links = sectionsForRole(user.role).map((section) => ({
    href: section.href,
    label: section.label,
    hint: section.hint,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <AccountHistorySync
        user={{
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        }}
      />
      <div className="site-header sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={roleHome(user.role)}
              className="text-sm font-semibold tracking-wide text-ink"
            >
              ReSchool
            </Link>
            <SectionNav links={links} />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthHeader
              user={{ fullName: user.fullName, role: user.role, email: user.email }}
            />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
