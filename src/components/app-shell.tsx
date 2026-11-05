"use client";

import { Suspense, type ReactNode } from "react";
import { ViewTransition } from "react";
import { NavigationChrome } from "@/components/navigation-chrome";

function ChromeFallback() {
  return (
    <div className="nav-dock nav-dock-static" aria-hidden>
      <span className="nav-dock-placeholder" />
    </div>
  );
}

/** Оболочка с переходами страниц и фирменным индикатором навигации. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ViewTransition default="reschool-fade">
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </ViewTransition>
      <Suspense fallback={<ChromeFallback />}>
        <NavigationChrome />
      </Suspense>
    </>
  );
}
