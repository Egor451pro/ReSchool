import { demoLoginAction } from "@/app/actions/auth";
import { demoAccounts, DEMO_PASSWORD } from "@/domain/access/demo-accounts";

export function DemoLogins({ next }: { next?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Демонстрационные учётки, пароль у всех{" "}
        <span className="font-medium text-zinc-900">{DEMO_PASSWORD}</span>.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <li key={account.email}>
            <form action={demoLoginAction}>
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <input type="hidden" name="email" value={account.email} />
              <input type="hidden" name="password" value={DEMO_PASSWORD} />
              <button
                type="submit"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm hover:bg-zinc-50"
              >
                <span className="block font-medium text-zinc-900">{account.label}</span>
                <span className="block font-mono text-xs text-zinc-500">{account.email}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
