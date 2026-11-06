"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendChatMessageAction, type ChatFormState } from "@/app/actions/chat";
import { mvpRoleLabel, type UserRole } from "@/domain/access/roles";

const initial: ChatFormState = {};

export type ChatMessageView = {
  id: string;
  body: string;
  createdAt: Date | string;
  authorId: string;
  author: { id: string; fullName: string; role: string };
};

export function OrderChat({
  orderId,
  currentUserId,
  messages,
  title = "Обсуждение объекта",
  peerLabel = "Собеседник",
  compact = false,
}: {
  orderId: string;
  currentUserId: string;
  messages: ChatMessageView[];
  title?: string;
  /** Кто «в сети» с другой стороны (Завхоз / Фрилансер). */
  peerLabel?: string;
  /** Компактный вид для боковой колонки карточки. */
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(sendChatMessageAction, initial);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  useEffect(() => {
    if (!state.error && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending, messages.length]);

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
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7d9a7a]" aria-hidden />
            В сети: {peerLabel}
          </p>
        </div>
      </header>

      <div className="flex max-h-[min(22rem,55dvh)] min-h-[10rem] flex-col gap-2.5 overflow-y-auto rounded-2xl border border-line bg-paper/60 p-2.5 sm:min-h-[12rem]">
        {messages.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs leading-5 text-leaf">
            Пока тихо. Обсудите детали ремонта, сроки и материалы.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.authorId === currentUserId;
            const when = new Date(message.createdAt).toLocaleString("ru-BY", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const roleName = mvpRoleLabel(message.author.role as UserRole);
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

      <form ref={formRef} action={action} className="flex items-end gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <textarea
          name="body"
          required
          rows={1}
          maxLength={2000}
          placeholder="Напишите сообщение…"
          className="field min-h-[2.75rem] flex-1 resize-none rounded-2xl bg-muted/70 py-2.5"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
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
      {state.error ? <p className="text-xs text-leaf">{state.error}</p> : null}
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
