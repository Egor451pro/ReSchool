"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] border-b border-line-strong bg-gold/25 px-4 py-2 text-center text-sm text-ink"
    >
      Нет сети. Формы лучше не отправлять — данные могут не сохраниться.{" "}
      <button
        type="button"
        className="font-medium underline underline-offset-2"
        onClick={() => window.location.reload()}
      >
        Повторить
      </button>
    </div>
  );
}
