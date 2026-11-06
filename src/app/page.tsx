import { Suspense } from "react";
import { HomeStart } from "@/components/home-start";
import { SiteHeader } from "@/components/site-header";

const steps = [
  { title: "Заявка", text: "Завхоз регистрирует школу и публикует вещь на ремонт" },
  { title: "Биржа", text: "Фрилансер предлагает цену, завхоз принимает заказ" },
  { title: "Ремонт", text: "Обсуждают детали в чате, фрилансер чинит и завершает" },
  { title: "Подтверждение", text: "Завхоз подтверждает выполнение — бюджет экономит" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell gap-8 text-ink sm:gap-10 sm:pt-12">
        <div className="flex max-w-3xl flex-col gap-3 sm:gap-4">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            Школьное имущество снова в деле
          </h1>
          <p className="text-base leading-7 text-leaf sm:text-lg sm:leading-8">
            Завхоз публикует то, что можно починить. Фрилансер берёт ремонт на бирже. Вещь
            возвращается — бюджет экономит на закупках.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Как это работает</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex h-full flex-col gap-2 rounded-3xl border border-line bg-surface p-4 shadow-[0_10px_28px_rgba(47,36,28,0.04)]"
              >
                <span className="text-sm font-medium text-leaf">{index + 1}</span>
                <span className="font-semibold text-ink">{step.title}</span>
                <span className="text-sm leading-6 text-leaf">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <Suspense fallback={<p className="text-sm text-leaf">Загружаем вход…</p>}>
          <HomeStart />
        </Suspense>
      </main>
    </>
  );
}
