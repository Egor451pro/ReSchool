"use client";

import { useActionState } from "react";
import {
  acceptOrderAction,
  proposePriceAction,
  type OrderFormState,
} from "@/app/actions/orders";
import { formatByn, formatBynAmount } from "@/domain/economy/money";
import { sideLabel, type PriceOfferSide } from "@/domain/orders/price-deal";

const initial: OrderFormState = {};

export type PriceOfferView = {
  id: string;
  amountKop: number;
  side: PriceOfferSide;
  status: string;
  createdAt: Date | string;
};

export function PriceDealPanel({
  orderId,
  role,
  schoolBudgetKop,
  openOfferKop,
  openOfferSide,
  offers,
  maxKop,
}: {
  orderId: string;
  role: "DONOR_STAFF" | "FREELANCER" | "PLATFORM_ADMIN";
  schoolBudgetKop: number;
  openOfferKop: number;
  openOfferSide: PriceOfferSide | null;
  offers: PriceOfferView[];
  maxKop: number;
}) {
  const [proposeState, proposeAction, proposePending] = useActionState(
    proposePriceAction,
    initial,
  );
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptOrderAction, initial);

  const isSchool = role === "DONOR_STAFF" || role === "PLATFORM_ADMIN";
  const current = openOfferKop > 0 ? openOfferKop : schoolBudgetKop;
  const lastSide = openOfferSide ? sideLabel(openOfferSide) : null;
  const showTakeBudget =
    !isSchool && schoolBudgetKop > 0 && schoolBudgetKop !== openOfferKop;

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
          Сделка по цене
        </p>
        <p className="text-sm leading-6 text-leaf">
          Бюджет школы → предложение → подтверждение завхоза. Чат — для деталей ремонта; цена
          меняется только здесь.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-muted/40 px-4 py-3">
        <p className="text-xs text-leaf">Текущая открытая сумма</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {formatByn(current)}
        </p>
        <p className="mt-1 text-xs text-leaf">
          Бюджет школы {formatByn(schoolBudgetKop)}
          {lastSide ? ` · последним предложил: ${lastSide}` : ""}
        </p>
      </div>

      {offers.length > 0 ? (
        <ol className="flex flex-col gap-1.5">
          {offers.map((offer) => {
            const when = new Date(offer.createdAt).toLocaleString("ru-BY", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const muted = offer.status !== "OPEN";
            return (
              <li
                key={offer.id}
                className={`flex flex-wrap items-baseline justify-between gap-2 text-sm ${
                  muted ? "text-leaf" : "font-medium text-ink"
                }`}
              >
                <span>
                  {sideLabel(offer.side)} · {formatByn(offer.amountKop)}
                  {offer.status === "OPEN" ? " · открыто" : ""}
                  {offer.status === "ACCEPTED" ? " · принято" : ""}
                </span>
                <span className="text-xs text-leaf">{when}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      <form action={proposeAction} className="flex flex-col gap-2">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="flex flex-col gap-1 text-sm text-leaf">
          {isSchool ? "Ваша встречная сумма, BYN" : "Ваше предложение, BYN"}
          <input
            name="feeByn"
            type="text"
            inputMode="decimal"
            required
            defaultValue={formatBynAmount(current)}
            className="field"
          />
        </label>
        <p className="text-xs text-leaf">Не выше {formatByn(maxKop)} (стоимость новых).</p>
        {proposeState.error ? (
          <p className="text-sm font-medium text-ink">{proposeState.error}</p>
        ) : null}
        <button type="submit" disabled={proposePending} className="btn-ghost btn-sm self-start">
          {proposePending ? "Отправляем…" : "Предложить"}
        </button>
      </form>

      {showTakeBudget ? (
        <form action={proposeAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="feeByn" value={formatBynAmount(schoolBudgetKop)} />
          <button type="submit" disabled={proposePending} className="btn-ghost btn-sm">
            Взять бюджет школы {formatByn(schoolBudgetKop)}
          </button>
        </form>
      ) : null}

      {isSchool ? (
        <form action={acceptAction} className="flex flex-col gap-2 border-t border-line pt-3">
          <input type="hidden" name="orderId" value={orderId} />
          {acceptState.error ? (
            <p className="text-sm font-medium text-ink">{acceptState.error}</p>
          ) : null}
          <button type="submit" disabled={acceptPending || current <= 0} className="btn-primary">
            {acceptPending
              ? "Подтверждаем…"
              : `Подтвердить ${formatByn(current)} и начать ремонт`}
          </button>
          <p className="text-xs leading-5 text-leaf">
            После подтверждения заказ сразу станет «В работе» — фрилансер сможет чинить.
          </p>
        </form>
      ) : (
        <p className="border-t border-line pt-3 text-xs leading-5 text-leaf">
          Ремонт начнётся, когда завхоз подтвердит текущую сумму.
        </p>
      )}
    </section>
  );
}
