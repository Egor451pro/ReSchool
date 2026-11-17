"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";

export type NotificationView = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationView[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<NotificationView | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set(initialItems.map((row) => row.id)));

  useEffect(() => {
    setItems(initialItems);
    setUnread(initialUnread);
    seen.current = new Set(initialItems.map((row) => row.id));
  }, [initialItems, initialUnread]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }
    setBrowserPermission(Notification.permission);
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;

    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          notification?: NotificationView;
        };
        if (payload.type !== "notification" || !payload.notification?.id) return;
        const row = payload.notification;
        if (seen.current.has(row.id)) return;
        seen.current.add(row.id);
        setItems((prev) => [row, ...prev].slice(0, 20));
        setUnread((count) => count + 1);
        setToast(row);
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            try {
              new Notification(row.title, {
                body: row.body,
                tag: row.id,
              });
            } catch {
              // ignore browser notification failures
            }
          }
        }
      } catch {
        // ignore
      }
    };

    // Не конкурируем с гидрацией и первым paint — подключаемся через ~1 с.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      source = new EventSource("/api/notifications/stream");
      source.addEventListener("message", onMessage);
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (source) {
        source.removeEventListener("message", onMessage);
        source.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    void Notification.requestPermission().then((permission) => {
      setBrowserPermission(permission);
    });
  }

  function openItem(row: NotificationView) {
    startTransition(async () => {
      const data = new FormData();
      data.set("id", row.id);
      await markNotificationReadAction(data);
      setItems((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item,
        ),
      );
      setUnread((count) => Math.max(0, count - (row.readAt ? 0 : 1)));
      setOpen(false);
      router.push(row.href);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnread(0);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-muted"
        aria-label={unread > 0 ? `Уведомления, непрочитанных ${unread}` : "Уведомления"}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_16px_40px_rgba(0, 59, 70,0.14)]">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <p className="text-sm font-semibold text-ink">Уведомления</p>
            <button
              type="button"
              className="text-xs text-leaf hover:text-ink disabled:opacity-50"
              disabled={pending || unread === 0}
              onClick={markAll}
            >
              Прочитать все
            </button>
          </div>
          {browserPermission === "default" ? (
            <button
              type="button"
              className="w-full border-b border-line px-3 py-2 text-left text-xs text-leaf hover:bg-muted"
              onClick={enableBrowserNotifications}
            >
              Включить уведомления браузера
            </button>
          ) : null}
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-leaf">Пока тихо</li>
            ) : (
              items.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted ${
                      row.readAt ? "opacity-70" : ""
                    }`}
                    onClick={() => openItem(row)}
                  >
                    <span className="text-sm font-medium text-ink">{row.title}</span>
                    <span className="text-xs leading-5 text-leaf">{row.body}</span>
                    <span className="text-[11px] text-leaf">
                      {new Date(row.createdAt).toLocaleString("ru-BY", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {toast ? (
        <button
          type="button"
          className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-[0_16px_40px_rgba(0, 59, 70,0.18)]"
          onClick={() => openItem(toast)}
        >
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          <p className="mt-0.5 text-xs leading-5 text-leaf">{toast.body}</p>
        </button>
      ) : null}
    </div>
  );
}
