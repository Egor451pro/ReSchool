import { HomeStart } from "@/components/home-start";
import { SiteHeader } from "@/components/site-header";

const steps = [
  { title: "Школа", text: "Публикует вещь, которую жалко выбросить" },
  { title: "Каталог", text: "Предмет видят мастерские района" },
  { title: "Мастерская", text: "Группа берёт ремонт как учебную практику" },
  { title: "Возврат", text: "Починенное имущество возвращается в школу" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 text-ink">
        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Школьное имущество становится учебной практикой
          </h1>
          <p className="text-lg leading-8 text-leaf">
            Школа отдаёт то, что можно починить. Мастерская чинит это на занятиях. Вещь
            возвращается — бюджет экономит на закупках.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Как это работает</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex h-full flex-col gap-2 rounded-xl border border-mint/70 bg-paper p-4"
              >
                <span className="text-sm font-medium text-gold">{index + 1}</span>
                <span className="font-semibold text-ink">{step.title}</span>
                <span className="text-sm leading-6 text-leaf">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <HomeStart />
      </main>
    </>
  );
}
