import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { roleLabels, sectionsForRole } from "@/domain/access/roles";
import { requireUser } from "@/server/auth/current-user";
import { SectionNav } from "@/components/section-nav";

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
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-mint/50 bg-mint/15">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionNav links={links} />
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink">
              {user.fullName}
              <span className="text-leaf"> · {roleLabels[user.role]}</span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-mint px-3 py-1.5 text-sm text-ink hover:bg-paper"
              >
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
