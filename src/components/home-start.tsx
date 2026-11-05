import { demoLoginAction } from "@/app/actions/auth";
import { DEMO_PASSWORD } from "@/domain/access/demo-accounts";

export function HomeStart() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">С чего начать</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <form action={demoLoginAction}>
          <input type="hidden" name="email" value="zavhoz@school1.demo" />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          <button
            type="submit"
            className="flex w-full flex-col gap-2 rounded-xl bg-ink px-5 py-5 text-left text-white hover:bg-leaf"
          >
            <span className="text-lg font-semibold">Я из школы</span>
            <span className="text-sm text-mint">
              Опубликовать парты, мебель или технику для ремонта
            </span>
          </button>
        </form>
        <form action={demoLoginAction}>
          <input type="hidden" name="email" value="master.wood@college.demo" />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          <button
            type="submit"
            className="flex w-full flex-col gap-2 rounded-xl border border-ink px-5 py-5 text-left text-ink hover:bg-mint/30"
          >
            <span className="text-lg font-semibold">Я из мастерской</span>
            <span className="text-sm text-leaf">
              Взять задание для учебной группы и провести ремонт
            </span>
          </button>
        </form>
      </div>
      <form action={demoLoginAction} className="text-sm text-leaf">
        <input type="hidden" name="email" value="admin@reschool.demo" />
        <input type="hidden" name="password" value={DEMO_PASSWORD} />
        Нужен обзор всего?{" "}
        <button type="submit" className="font-medium text-leaf underline hover:text-ink">
          Войти как администратор
        </button>
      </form>
    </section>
  );
}
