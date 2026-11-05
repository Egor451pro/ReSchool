"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STATUS_WORDS = ["Загрузка", "Рендер", "Запрос", "Синхронизация", "Подготовка"] as const;

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
  const [statusIndex, setStatusIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setPending(false);
    setProgress(0);
    setStatusIndex(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (statusRef.current) {
      clearInterval(statusRef.current);
      statusRef.current = null;
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
      setStatusIndex(0);
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.target === "_blank") return;
      setPending(true);
      setProgress(18);
      setStatusIndex(0);
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
    statusRef.current = setInterval(() => {
      setStatusIndex((index) => (index + 1) % STATUS_WORDS.length);
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusRef.current) clearInterval(statusRef.current);
    };
  }, [pending]);

    const status = STATUS_WORDS[statusIndex] ?? "Загрузка";

  return (
    <>
      <div className={`nav-progress ${pending ? "nav-progress-active" : ""}`} aria-hidden>
        <div className="nav-progress-bar" style={{ width: `${pending ? progress : 0}%` }} />
      </div>

      <div className={`nav-veil ${pending ? "nav-veil-active" : ""}`} aria-hidden />

      <Link
        href="/"
        className={`nav-island ${pending ? "nav-island-busy" : ""}`}
        aria-label={pending ? status : "На главную ReSchool"}
        title={pending ? status : "ReSchool"}
      >
        <span className="nav-island-core">
          <Image
            src="/brand/rs-mark.png"
            alt=""
            width={40}
            height={40}
            className="nav-island-mark"
            priority
          />
          <span className={`nav-island-label ${pending ? "nav-island-label-on" : ""}`}>
            <span key={status} className="nav-island-word">
              {status}
            </span>
          </span>
        </span>
      </Link>
    </>
  );
}
