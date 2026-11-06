"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STATUS_WORD = "Загрузка";
/** Не показывать остров, если переход быстрее этого. */
const SHOW_DELAY_MS = 240;
/** Если уже показали — держать хотя бы столько, без мигания. */
const MIN_VISIBLE_MS = 420;

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
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const showDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const navigatingRef = useRef(false);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  function clearShowDelay() {
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
      showDelayRef.current = null;
    }
  }

  function clearHideDelay() {
    if (hideDelayRef.current) {
      clearTimeout(hideDelayRef.current);
      hideDelayRef.current = null;
    }
  }

  function startNavigation() {
    navigatingRef.current = true;
    clearHideDelay();
    clearShowDelay();
    setProgress(10);
    showDelayRef.current = setTimeout(() => {
      if (!navigatingRef.current) return;
      shownAtRef.current = Date.now();
      visibleRef.current = true;
      setVisible(true);
      setProgress(18);
      showDelayRef.current = null;
    }, SHOW_DELAY_MS);
  }

  function finishNavigation() {
    navigatingRef.current = false;
    clearShowDelay();

    if (!visibleRef.current) {
      setProgress(0);
      shownAtRef.current = null;
      return;
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const remain = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
    clearHideDelay();
    hideDelayRef.current = setTimeout(() => {
      visibleRef.current = false;
      setVisible(false);
      setProgress(0);
      shownAtRef.current = null;
      hideDelayRef.current = null;
    }, remain);
  }

  useEffect(() => {
    finishNavigation();
  }, [routeKey]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;
      startNavigation();
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.target === "_blank") return;
      startNavigation();
    }

    document.addEventListener("click", onPointerDown, true);
    document.addEventListener("submit", onSubmit, true);
    const safety = setInterval(() => {
      if (navigatingRef.current && shownAtRef.current && Date.now() - shownAtRef.current > 8000) {
        finishNavigation();
      }
    }, 2000);

    return () => {
      document.removeEventListener("click", onPointerDown, true);
      document.removeEventListener("submit", onSubmit, true);
      clearInterval(safety);
      clearShowDelay();
      clearHideDelay();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  return (
    <>
      <div className={`nav-progress ${visible ? "nav-progress-active" : ""}`} aria-hidden>
        <div className="nav-progress-bar" style={{ width: `${visible ? progress : 0}%` }} />
      </div>

      <div className={`nav-veil ${visible ? "nav-veil-active" : ""}`} aria-hidden />

      <Link
        href="/"
        className={`nav-island ${visible ? "nav-island-busy" : ""}`}
        aria-label={visible ? STATUS_WORD : "На главную ReSchool"}
        title={visible ? STATUS_WORD : "ReSchool"}
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
          <span className={`nav-island-label ${visible ? "nav-island-label-on" : ""}`}>
            <span className="nav-island-word">
              {STATUS_WORD}
              <span className="nav-island-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </span>
          </span>
        </span>
      </Link>
    </>
  );
}
