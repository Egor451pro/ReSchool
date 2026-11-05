"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  title = "Чат по заказу",
}: {
  orderId: string;
  currentUserId: string;
  messages: ChatMessageView[];
  title?: string;
}) {
  const [open, setOpen] = useState(true);
  const [state, action, pending] = useActionState(sendChatMessageAction, initial);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, open]);

  useEffect(() => {
    if (!state.error && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending, messages.length]);

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-[0_8px_24px_rgba(47,36,28,0.03)]">
      <button
        type="button"
        className="flex items-center justify-between text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-xs text-leaf">{open ? "Свернуть" : "Открыть"}</span>
      </button>

      {open ? (
        <>
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-2xl border border-line bg-paper p-2">
            {messages.length === 0 ? (
              <p className="px-1 py-3 text-xs text-leaf">
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
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-0.5 rounded-xl px-2.5 py-2 text-sm ${
                      mine ? "ml-6 bg-deep text-cream" : "mr-6 bg-mint/45 text-ink"
                    }`}
                  >
                    <div
                      className={`flex justify-between gap-2 text-[11px] ${
                        mine ? "text-cream/70" : "text-leaf"
                      }`}
                    >
                      <span>
                        {mvpRoleLabel(message.author.role as UserRole)} · {message.author.fullName}
                      </span>
                      <span>{when}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-5">{message.body}</p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form ref={formRef} action={action} className="flex flex-col gap-2">
            <input type="hidden" name="orderId" value={orderId} />
            <textarea
              name="body"
              required
              rows={2}
              maxLength={2000}
              placeholder="Напишите сообщение…"
              className="field min-h-[2.75rem] resize-y"
            />
            {state.error ? <p className="text-xs text-ink">{state.error}</p> : null}
            <button type="submit" disabled={pending} className="btn-primary btn-sm self-end">
              {pending ? "Отправляем…" : "Отправить"}
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
