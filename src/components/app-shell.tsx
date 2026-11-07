"use client";

import { Suspense, type ReactNode } from "react";
import { NavigationChrome } from "@/components/navigation-chrome";
import { OfflineBanner } from "@/components/offline-banner";
import { SiteFooter } from "@/components/site-footer";

function ChromeFallback() {
  return (
    <div className="nav-island nav-dock-static" aria-hidden>
      <span className="nav-island-core">
        <span className="nav-dock-placeholder" />
      </span>
    </div>
  );
}

/** Оболочка с фирменным индикатором навигации. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-full flex-1 flex-col">
        <OfflineBanner />
        {children}
        <SiteFooter />
      </div>
      <Suspense fallback={<ChromeFallback />}>
        <NavigationChrome />
      </Suspense>
    </>
  );
}
