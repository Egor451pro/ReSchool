const accounts = [
  ["Завхоз школы №1", "zavhoz@school1.demo"],
  ["Мастер столярного дела", "master.wood@college.demo"],
  ["Мастер ремонта компьютеров", "master.pc@college.demo"],
  ["Учащийся, группа СТ-21", "student.bondar@college.demo"],
  ["Аналитик отдела образования", "analyst@district.demo"],
  ["Администратор", "admin@reschool.demo"],
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 bg-white px-6 py-12 text-ink">
      <p className="rounded-lg bg-gold px-4 py-3 text-sm text-ink">
        Демонстрационные синтетические данные. Цифры экономики — допущения, они
        подлежат уточнению и не являются официальными нормативами.
      </p>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Школьное имущество становится учебной практикой
        </h1>
        <p className="text-lg leading-8 text-leaf">
          Школа публикует то, что можно починить. Колледж берёт это в работу как
          задание группы. Восстановленная вещь возвращается в учреждение, а
          отдел образования видит экономию в рублях.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Демо-вход</h2>
        <p className="text-leaf">
          Пароль всех учёток: <span className="font-medium text-ink">demo1234</span>.
          На экране входа можно зайти одной кнопкой. Каждая роль видит только свои разделы.
        </p>
        <ul className="divide-y divide-mint/60 rounded-xl border border-mint/60">
          {accounts.map(([role, email]) => (
            <li key={email} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
              <span className="text-ink">{role}</span>
              <span className="font-mono text-sm text-leaf">{email}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
