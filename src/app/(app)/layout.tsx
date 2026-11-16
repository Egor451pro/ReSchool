import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AccountHistorySync } from "@/components/account-history-sync";
import { AuthHeader } from "@/components/auth-header";
import { NotificationBell } from "@/components/notification-bell";
import { SectionNav } from "@/components/section-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome, sectionsForRole } from "@/domain/access/roles";
import { requireUser } from "@/server/auth/current-user";
import { listRecentNotifications } from "@/server/repositories/notification-repository";

export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-leaf sm:px-6">Открываем раздел…</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

function BellSkeleton() {
  return (
    <div
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface"
      aria-hidden
    />
  );
}

async function HeaderNotifications() {
  const user = await requireUser();
  const recent = await listRecentNotifications(user.id, 20);
  const notifications = recent.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  }));
  const unread = notifications.filter((row) => !row.readAt).length;

  return <NotificationBell initialItems={notifications} initialUnread={unread} />;
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={roleHome(user.role)}
              className="shrink-0 text-sm font-semibold tracking-wide text-ink"
            >
              ReSchool
            </Link>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Suspense fallback={<BellSkeleton />}>
                <HeaderNotifications />
              </Suspense>
              <ThemeToggle />
              <AuthHeader
                user={{ fullName: user.fullName, role: user.role, email: user.email }}
              />
            </div>
          </div>
          <SectionNav links={links} />
        </div>
      </div>
      {children}
    </div>
  );
}
