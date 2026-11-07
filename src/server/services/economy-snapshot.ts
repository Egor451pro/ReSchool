import "server-only";

import { calculateItemEconomy } from "@/domain/economy";
import type { ItemEconomy } from "@/domain/economy";
import {
  findAssumptionByKind,
  findDashboardAssumption,
  findDisposalRate,
} from "@/server/repositories/economy-repository";

type SnapshotOrder = {
  actualMaterialsKop: number;
  transportKop: number;
  agreedFeeKop: number;
  item: {
    quantity: number;
    newUnitPriceKop: number;
    categoryId: string;
  };
};

type AssumptionRow = NonNullable<Awaited<ReturnType<typeof findAssumptionByKind>>>;

/** Общий расчёт полей EconomySnapshot из заказа и базовых допущений. */
export async function buildOrderEconomySnapshot(order: SnapshotOrder): Promise<{
  base: AssumptionRow;
  materialsKop: number;
  transportKop: number;
  freelancerFeeKop: number;
  economy: ItemEconomy;
} | null> {
  const base =
    (await findAssumptionByKind("BASE")) ?? (await findDashboardAssumption());
  if (!base) return null;

  const rate = await findDisposalRate(base.id, order.item.categoryId);
  const disposalPerUnitKop = rate?.perUnitKop ?? base.avgDisposalKop;
  const materialsKop = order.actualMaterialsKop;
  const transportKop = order.transportKop;
  const freelancerFeeKop = order.agreedFeeKop;
  const economy = calculateItemEconomy({
    quantity: order.item.quantity,
    newUnitPriceKop: order.item.newUnitPriceKop,
    materialsKop,
    transportKop,
    freelancerFeeKop,
    disposalPerUnitKop,
    practiceConsumableKop: base.practiceConsumableKop,
    substitutionMilli: base.substitutionMilli,
  });

  return { base, materialsKop, transportKop, freelancerFeeKop, economy };
}
