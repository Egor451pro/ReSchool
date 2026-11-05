"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

function isInternalNav(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  if (anchor.getAttribute("rel")?.includes("external")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    return url.pathname + url.search !== window.location.pathname + window.location.search;
  } catch {
    return false;
  }
}

export function NavigationChrome() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setPending(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [routeKey]);

  useEffect(() => {
    if (!pending) return;
    const safety = setTimeout(() => {
      setPending(false);
      setProgress(0);
    }, 8000);
    return () => clearTimeout(safety);
  }, [pending]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;
      setPending(true);
      setProgress(12);
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.target === "_blank") return;
      const method = (form.getAttribute("method") ?? "get").toLowerCase();
      if (method !== "get" && form.getAttribute("action")?.startsWith("http")) return;
      // Server actions / навигация после submit — мягкий индикатор
      setPending(true);
      setProgress(18);
    }

    document.addEventListener("click", onPointerDown, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onPointerDown, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    timerRef.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 88) return value;
        const step = value < 40 ? 9 : value < 70 ? 4 : 1.5;
        return Math.min(88, value + step);
      });
    }, 180);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pending]);

  return (
    <>
      <div
        className={`nav-progress ${pending ? "nav-progress-active" : ""}`}
        aria-hidden
      >
        <div className="nav-progress-bar" style={{ width: `${pending ? progress : 0}%` }} />
      </div>

      <div
        className={`nav-veil ${pending ? "nav-veil-active" : ""}`}
        aria-hidden
      />

      <Link
        href="/"
        className={`nav-dock ${pending ? "nav-dock-busy" : ""}`}
        aria-label={pending ? "Загрузка страницы" : "На главную ReSchool"}
        title={pending ? "Загрузка…" : "ReSchool"}
      >
        <BrandMark className="nav-dock-mark" size={48} />
        <span className="nav-dock-ring" aria-hidden />
      </Link>
    </>
  );
}
