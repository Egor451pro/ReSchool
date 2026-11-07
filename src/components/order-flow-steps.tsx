import { formatByn } from "@/domain/economy/money";
import type { ItemStatus } from "@/domain/items/labels";
import type { OrderStatus } from "@/domain/orders/labels";

type Step = {
  title: string;
  detail: string;
  state: "done" | "current" | "todo";
};

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span
            className={
              step.state === "done"
                ? "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint/40 text-xs font-semibold text-ink"
                : step.state === "current"
                  ? "panel-accent mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  : "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-leaf ring-1 ring-line"
            }
            aria-hidden
          >
            {step.state === "done" ? "✓" : index + 1}
          </span>
          <div className="min-w-0">
            <p
              className={
                step.state === "todo" ? "text-sm font-medium text-leaf" : "text-sm font-medium text-ink"
              }
            >
              {step.title}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-leaf">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function mark(steps: Omit<Step, "state">[], currentIndex: number): Step[] {
  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "todo",
  }));
}

export function SchoolOrderSteps({
  itemStatus,
  orderStatus,
  schoolAccepted,
  agreedFeeKop,
}: {
  itemStatus: ItemStatus;
  orderStatus: OrderStatus | null;
  schoolAccepted: boolean;
  agreedFeeKop?: number | null;
}) {
  if (!orderStatus) {
    return (
      <StepList
        steps={mark(
          [
            {
              title: "Карточка в каталоге",
              detail: "Укажите бюджет — фрилансер ответит предложением или встречной ценой.",
            },
            {
              title: "Торг и подтверждение",
              detail: "Меняйте сумму в блоке сделки, затем подтвердите — заказ перейдёт в работу.",
            },
            {
              title: "Ремонт",
              detail: "Фрилансер чинит и пишет в чат.",
            },
            {
              title: "Подтвердить закрытие",
              detail: "Когда ремонт готов — подтвердите и начислится выплата.",
            },
          ],
          0,
        )}
      />
    );
  }

  let current = 0;
  if (orderStatus === "ASSIGNED" && !schoolAccepted) current = 1;
  else if (
    orderStatus === "IN_PROGRESS" ||
    (orderStatus === "ASSIGNED" && schoolAccepted) ||
    orderStatus === "QUALITY_CHECK"
  ) {
    current = 2;
  } else if (orderStatus === "COMPLETED" && itemStatus === "READY") current = 3;
  else if (itemStatus === "CLOSED") current = 4;

  const fee =
    typeof agreedFeeKop === "number" ? ` Открытая сумма: ${formatByn(agreedFeeKop)}.` : "";

  return (
    <StepList
      steps={mark(
        [
          {
            title: "Есть предложение",
            detail: `Заявка получена.${fee}`,
          },
          {
            title: "Торг → подтвердить цену",
            detail: "Можно слать встречные суммы. Ремонт начнётся только после вашей кнопки подтверждения.",
          },
          {
            title: "Ремонт в работе",
            detail: "Фрилансер выполняет заказ.",
          },
          {
            title: "Подтвердить закрытие",
            detail: "Проверьте результат и закройте заказ.",
          },
        ],
        Math.min(current, 3),
      )}
    />
  );
}

export function FreelancerOrderSteps({
  itemStatus,
  orderStatus,
  schoolAccepted,
  agreedFeeKop,
}: {
  itemStatus: ItemStatus;
  orderStatus: OrderStatus;
  schoolAccepted: boolean;
  agreedFeeKop: number;
}) {
  let current = 0;
  if (orderStatus === "ASSIGNED" && !schoolAccepted) current = 1;
  else if (
    orderStatus === "IN_PROGRESS" ||
    (orderStatus === "ASSIGNED" && schoolAccepted) ||
    orderStatus === "QUALITY_CHECK"
  ) {
    current = 2;
  } else if (orderStatus === "COMPLETED" && itemStatus === "READY") current = 3;
  else if (itemStatus === "CLOSED" || orderStatus === "COMPLETED") current = 4;

  return (
    <StepList
      steps={mark(
        [
          {
            title: "Торг по цене",
            detail: `Открытая сумма ${formatByn(agreedFeeKop)}. Можно предложить встречную.`,
          },
          {
            title: "Ждём подтверждения завхоза",
            detail: "Только завхоз фиксирует цену и запускает ремонт.",
          },
          {
            title: "Ремонт",
            detail: "Можно чинить и писать в чат. Когда готово — закройте заказ.",
          },
          {
            title: "Ждём подтверждения школы",
            detail: "После подтверждения завхоза придёт выплата.",
          },
        ],
        Math.min(current, 3),
      )}
    />
  );
}
