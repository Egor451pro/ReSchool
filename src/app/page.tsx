import { Suspense } from "react";
import { HomeStart } from "@/components/home-start";
import { SiteHeader } from "@/components/site-header";

const steps = [
  { title: "Заявка", text: "Завхоз регистрирует школу и публикует вещь на ремонт" },
  { title: "Биржа", text: "Фрилансер предлагает цену, завхоз принимает заказ" },
  { title: "Ремонт", text: "Обсуждают детали в чате, фрилансер чинит и завершает" },
  { title: "Подтверждение", text: "Завхоз подтверждает результат — бюджет экономит" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell gap-8 text-ink sm:gap-12 sm:pt-12">
        <div className="flex max-w-3xl flex-col gap-3 sm:gap-4">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            Школьное имущество снова в деле
          </h1>
          <p className="text-base leading-7 text-leaf sm:text-lg sm:leading-8">
            Завхоз публикует то, что можно починить. Фрилансер берёт ремонт на бирже. Вещь
            возвращается — бюджет экономит на закупках.
          </p>
        </div>

        <section
          aria-labelledby="home-login-heading"
          className="rounded-[1.75rem] border-2 border-line-strong bg-surface p-4 shadow-[0_16px_40px_rgba(47,36,28,0.08)] sm:rounded-[2rem] sm:p-6"
        >
          <div className="mb-4 flex flex-col gap-1 sm:mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              Для участников
            </p>
            <h2 id="home-login-heading" className="text-xl font-semibold text-ink sm:text-2xl">
              Вход в кабинет
            </h2>
            <p className="text-sm leading-6 text-leaf">
              Выберите роль и войдите в уже созданный аккаунт — или зарегистрируйтесь.
            </p>
          </div>
          <Suspense fallback={<p className="text-sm text-leaf">Загружаем вход…</p>}>
            <HomeStart title="Кто вы?" />
          </Suspense>
        </section>

        <section
          aria-labelledby="home-how-heading"
          className="rounded-[1.75rem] border border-dashed border-line bg-muted/35 p-4 sm:rounded-[2rem] sm:p-6"
        >
          <div className="mb-4 flex flex-col gap-1 sm:mb-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-leaf">
              Сценарий
            </p>
            <h2 id="home-how-heading" className="text-lg font-semibold text-ink">
              Как это работает
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-leaf">
              Краткий путь вещи от заявки завхоза до подтверждённого ремонта.
            </p>
          </div>
          <ol className="relative grid gap-0 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-3 border-l border-line py-3 pl-4 first:pt-0 last:pb-0 sm:border-l-0 sm:border-t-0 sm:py-0 sm:pl-0"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-ink ring-1 ring-line sm:mt-0"
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium text-ink">{step.title}</span>
                  <span className="text-sm leading-6 text-leaf">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
