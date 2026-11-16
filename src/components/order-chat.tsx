"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import {
  listOrderChatMessagesAction,
  sendChatMessageAction,
} from "@/app/actions/chat";
import { mvpRoleLabel, type UserRole } from "@/domain/access/roles";
import { isPriceSystemMessage, stripPriceMarker } from "@/domain/orders/price-deal";

const POLL_MS = 1500;

export type ChatMessageView = {
  id: string;
  body: string;
  createdAt: Date | string;
  authorId: string;
  author: { id: string; fullName: string; role: string };
};

function normalizeMessage(message: ChatMessageView): ChatMessageView {
  return {
    ...message,
    createdAt:
      typeof message.createdAt === "string"
        ? message.createdAt
        : message.createdAt.toISOString(),
  };
}

function mergeById(
  current: ChatMessageView[],
  incoming: ChatMessageView[],
): ChatMessageView[] {
  const map = new Map<string, ChatMessageView>();
  for (const row of current) map.set(row.id, row);
  for (const row of incoming) map.set(row.id, normalizeMessage(row));
  const merged = [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  // Убрать optimistic local-*, если сервер уже отдал то же тело от того же автора.
  const confirmed = new Set(
    merged
      .filter((row) => !row.id.startsWith("local-"))
      .map((row) => `${row.authorId}\0${row.body}`),
  );
  return merged.filter((row) => {
    if (!row.id.startsWith("local-")) return true;
    return !confirmed.has(`${row.authorId}\0${row.body}`);
  });
}

export function OrderChat({
  orderId,
  currentUserId,
  messages: initialMessages,
  title = "Обсуждение объекта",
  peerLabel = "Собеседник",
  compact = false,
}: {
  orderId: string;
  currentUserId: string;
  messages: ChatMessageView[];
  title?: string;
  peerLabel?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState(() => initialMessages.map(normalizeMessage));
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seenIds = useRef(new Set(initialMessages.map((row) => row.id)));

  // Не затираем локальные/SSE сообщения при редком RSC refresh — только доливаем.
  const onInitialMessages = useEffectEvent((next: ChatMessageView[]) => {
    const normalized = next.map(normalizeMessage);
    for (const row of normalized) seenIds.current.add(row.id);
    setMessages((prev) => mergeById(prev, normalized));
  });

  useEffect(() => {
    onInitialMessages(initialMessages);
  }, [initialMessages]);

  const ingestMessages = useEffectEvent((incoming: ChatMessageView[]) => {
    if (incoming.length === 0) return;
    for (const row of incoming) seenIds.current.add(row.id);
    setMessages((prev) => mergeById(prev, incoming));
  });

  useEffect(() => {
    const source = new EventSource(`/api/chat/${orderId}/stream`);
    const onReady = () => setLive(true);
    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          message?: ChatMessageView;
        };
        if (payload.type !== "chat" || !payload.message?.id) return;
        if (seenIds.current.has(payload.message.id)) return;
        ingestMessages([payload.message]);
      } catch {
        // ignore malformed events
      }
    };
    const onError = () => setLive(false);
    source.addEventListener("ready", onReady);
    source.addEventListener("message", onMessage);
    source.addEventListener("error", onError);
    return () => {
      source.removeEventListener("ready", onReady);
      source.removeEventListener("message", onMessage);
      source.removeEventListener("error", onError);
      source.close();
      setLive(false);
    };
  }, [orderId]);

  // Страховка: даже если SSE и Action на разных копиях шины — подтянем из БД.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await listOrderChatMessagesAction(orderId);
        if (cancelled || !result.ok) return;
        ingestMessages(result.messages);
      } catch {
        // сеть / HMR — следующий тик
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  function submitBody(raw: string) {
    const body = raw.trim();
    if (!body || pending) return;

    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessageView = {
      id: optimisticId,
      body,
      createdAt: new Date().toISOString(),
      authorId: currentUserId,
      author: { id: currentUserId, fullName: "", role: "" },
    };
    seenIds.current.add(optimisticId);
    setMessages((prev) => [...prev, optimistic]);
    setError(null);
    formRef.current?.reset();
    textareaRef.current?.focus();

    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("body", body);

    startTransition(async () => {
      const result = await sendChatMessageAction({}, formData);
      if (result.error) {
        setMessages((prev) => prev.filter((row) => row.id !== optimisticId));
        seenIds.current.delete(optimisticId);
        setError(result.error);
        return;
      }
      if (result.message) {
        seenIds.current.add(result.message.id);
        setMessages((prev) => {
          const withoutLocal = prev.filter((row) => row.id !== optimisticId);
          if (withoutLocal.some((row) => row.id === result.message!.id)) {
            return withoutLocal;
          }
          return [...withoutLocal, normalizeMessage(result.message!)];
        });
        seenIds.current.delete(optimisticId);
      }
    });
  }

  return (
    <section
      className={`flex flex-col gap-3 rounded-3xl border border-line bg-surface shadow-[var(--shadow-soft)] transition-colors duration-300 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-leaf">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                live ? "bg-[#7d9a7a]" : "bg-line-strong"
              }`}
              aria-hidden
            />
            {live ? `Онлайн · ${peerLabel}` : `Подключение… · ${peerLabel}`}
          </p>
        </div>
      </header>

      <div className="flex max-h-[min(22rem,55dvh)] min-h-[10rem] flex-col gap-2.5 overflow-y-auto rounded-2xl border border-line bg-paper/60 p-2.5 sm:min-h-[12rem]">
        {messages.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs leading-5 text-leaf">
            Пока тихо. Детали ремонта и сроки — здесь; цену меняйте в блоке «Сделка по цене».
          </p>
        ) : (
          messages.map((message) => {
            const when = new Date(message.createdAt).toLocaleString("ru-BY", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            if (isPriceSystemMessage(message.body)) {
              return (
                <div
                  key={message.id}
                  className="mx-auto max-w-[95%] rounded-xl bg-muted/70 px-3 py-1.5 text-center text-xs leading-5 text-leaf"
                >
                  <span>{stripPriceMarker(message.body)}</span>
                  <span className="ml-2 opacity-70">{when}</span>
                </div>
              );
            }
            const mine = message.authorId === currentUserId;
            const roleName = message.author.role
              ? mvpRoleLabel(message.author.role as UserRole)
              : "Вы";
            return (
              <div
                key={message.id}
                className={`flex max-w-[92%] flex-col gap-0.5 rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "panel-accent ml-auto"
                    : "mr-auto bg-muted text-ink ring-1 ring-line"
                }`}
              >
                <div
                  className={`flex flex-wrap justify-between gap-2 text-[11px] ${
                    mine ? "panel-accent-muted" : "text-leaf"
                  }`}
                >
                  <span className="font-medium">{roleName}</span>
                  <span>{when}</span>
                </div>
                <p className="whitespace-pre-wrap leading-5">{message.body}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitBody(textareaRef.current?.value ?? "");
        }}
      >
        <textarea
          ref={textareaRef}
          name="body"
          required
          rows={1}
          maxLength={2000}
          placeholder="Напишите сообщение…"
          className="field min-h-[2.75rem] flex-1 resize-none rounded-2xl bg-muted/70 py-2.5"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitBody(event.currentTarget.value);
            }
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint text-[#2f241c] shadow-[0_6px_16px_rgba(47,36,28,0.18)] transition hover:opacity-90 disabled:opacity-55"
          aria-label={pending ? "Отправляем" : "Отправить"}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l16-7-6 16-2.5-6.5L4 12z" />
          </svg>
        </button>
      </form>
      {error ? <p className="text-xs text-leaf">{error}</p> : null}
    </section>
  );
}

export function OrderChatLocked({ reason }: { reason: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-dashed border-line bg-surface/80 p-4 shadow-[var(--shadow-soft)]">
      <h2 className="text-sm font-semibold text-ink">Обсуждение объекта</h2>
      <p className="text-sm leading-6 text-leaf">{reason}</p>
    </section>
  );
}
