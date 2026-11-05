"use client";

import Link from "next/link";
import { demoLoginAction } from "@/app/actions/auth";
import { DEMO_PASSWORD } from "@/domain/access/demo-accounts";

const FREELANCER_EMAIL = "freelancer.wood@reschool.demo";

export function HomeStartClient({
  next,
  title = "С чего начать",
}: {
  next?: string;
  title?: string;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/register"
          className="flex w-full flex-col gap-2 rounded-3xl border border-mint bg-mint px-5 py-5 text-left text-[#2f241c] shadow-[var(--shadow-soft)] transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--mint)_88%,#2f241c)]"
        >
          <span className="text-lg font-semibold">Я завхоз</span>
          <span className="text-sm text-[#2f241c]/70">
            Зарегистрировать свою школу и публиковать вещи на ремонт
          </span>
        </Link>
        <Link
          href="/register?role=freelancer"
          className="flex w-full flex-col gap-2 rounded-3xl border border-line bg-surface px-5 py-5 text-left text-ink shadow-[0_10px_28px_rgba(47,36,28,0.04)] transition hover:border-gold/40 hover:bg-gold/10"
        >
          <span className="text-lg font-semibold">Я фрилансер</span>
          <span className="text-sm text-leaf">Создать учётку и брать заказы на бирже</span>
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-leaf">
        <form action={demoLoginAction}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <input type="hidden" name="email" value={FREELANCER_EMAIL} />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          Демо:{" "}
          <button type="submit" className="font-medium text-gold underline decoration-gold/40 underline-offset-2 hover:text-ink">
            войти как фрилансер
          </button>
        </form>
        <form action={demoLoginAction}>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <input type="hidden" name="email" value="admin@reschool.demo" />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          <button type="submit" className="font-medium text-gold underline decoration-gold/40 underline-offset-2 hover:text-ink">
            войти как администратор
          </button>
        </form>
      </div>
    </section>
  );
}
