import { demoLoginAction } from "@/app/actions/auth";
import { demoAccounts, DEMO_PASSWORD } from "@/domain/access/demo-accounts";

export function DemoLogins({ next }: { next?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">Выберите профиль</h2>
        <p className="text-sm text-leaf">
          Пароль <span className="font-medium text-ink">{DEMO_PASSWORD}</span> подставится сам.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {demoAccounts.map((account) => (
          <li key={account.email} className="h-full">
            <form action={demoLoginAction} className="h-full">
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <input type="hidden" name="email" value={account.email} />
              <input type="hidden" name="password" value={DEMO_PASSWORD} />
              <button
                type="submit"
                className="flex h-full w-full flex-col gap-2 rounded-xl border border-mint/70 bg-paper px-4 py-5 text-left hover:border-leaf hover:bg-mint/20"
              >
                <span className="text-lg font-semibold text-ink">{account.label}</span>
                <span className="text-sm leading-6 text-leaf">{account.hint}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
