import { PageHeader } from "@/components/ui/page-header";
import { PageShell, Surface } from "@/components/ui/surface";
import { formatByn } from "@/domain/economy/money";
import { requireRoles } from "@/server/auth/current-user";
import { loadWalletForActor } from "@/server/services/wallet-service";

export const instant = false;

const kindLabels = {
  PAYOUT: "Выплата",
  BONUS: "Премия",
  ADJUSTMENT: "Корректировка",
} as const;

export default async function WalletPage() {
  const user = await requireRoles(["DONOR_STAFF", "FREELANCER"]);
  const wallet = await loadWalletForActor(user);

  return (
    <PageShell>
      <PageHeader
        title="Кошелёк"
        description={
          user.role === "FREELANCER"
            ? "Симуляция выплат за подтверждённые ремонты."
            : "Симуляция премий завхозу из освобождённого фонда слесарей."
        }
      />

      <Surface className="flex flex-col gap-2 border-transparent bg-deep text-cream shadow-[0_16px_40px_rgba(47,36,28,0.16)]">
        <p className="text-sm text-cream/65">Баланс</p>
        <p className="text-3xl font-semibold text-cream">
          {formatByn(wallet?.balanceKop ?? 0)}
        </p>
      </Surface>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">История</h2>
        {!wallet || wallet.transactions.length === 0 ? (
          <Surface className="border-dashed text-sm text-leaf">
            Пока нет начислений. Они появятся после подтверждения ремонта завхозом.
          </Surface>
        ) : (
          <ul className="flex flex-col gap-2">
            {wallet.transactions.map((txn) => (
              <Surface key={txn.id} as="li" className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-ink">{kindLabels[txn.kind]}</span>
                  {txn.note ? <span className="text-sm text-leaf">{txn.note}</span> : null}
                  <span className="text-xs text-leaf">
                    {txn.createdAt.toLocaleString("ru-BY")}
                  </span>
                </div>
                <span className="shrink-0 font-medium text-ink">
                  +{formatByn(txn.amountKop)}
                </span>
              </Surface>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
