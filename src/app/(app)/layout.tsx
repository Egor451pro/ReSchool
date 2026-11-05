import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { mvpRoleLabel, roleHome, sectionsForRole } from "@/domain/access/roles";
import { requireUser } from "@/server/auth/current-user";
import { SectionNav } from "@/components/section-nav";
import { ThemeToggle } from "@/components/theme-toggle";

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
            <span className="text-sm text-ink">
              {mvpRoleLabel(user.role)}
              {user.institutionName ? (
                <span className="text-leaf"> · {user.institutionName}</span>
              ) : null}
            </span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost btn-sm">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
