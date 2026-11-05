import { assertEconomyInput } from "./money";
import type { ItemEconomy, ItemEconomyInput, RepairAdvice } from "./types";

/**
 * Экономия одного заказа.
 * Стоимость ремонта = материалы + транспорт + гонорар фрилансера.
 * practiceSaving оставлен в типе для совместимости со старыми снимками, в MVP = 0.
 */
export function calculateItemEconomy(input: ItemEconomyInput): ItemEconomy {
  assertEconomyInput(input);

  const newPriceKop = input.quantity * input.newUnitPriceKop;
  const freelancerFeeKop = input.freelancerFeeKop;
  const restorationKop = input.materialsKop + input.transportKop + freelancerFeeKop;
  const procurementSavingKop = newPriceKop - restorationKop;
  const avoidedDisposalKop = input.disposalPerUnitKop * input.quantity;
  const propertyBudgetKop = procurementSavingKop + avoidedDisposalKop;
  const practiceSavingKop = 0;
  const advice = adviceFor(procurementSavingKop, propertyBudgetKop);

  return {
    newPriceKop,
    restorationKop,
    procurementSavingKop,
    avoidedDisposalKop,
    propertyBudgetKop,
    practiceSavingKop,
    freelancerFeeKop,
    combinedKop: propertyBudgetKop,
    worthRepairing: propertyBudgetKop > 0,
    advice,
  };
}

function adviceFor(procurementSavingKop: number, propertyBudgetKop: number): RepairAdvice {
  if (propertyBudgetKop <= 0) return "dispose";
  if (procurementSavingKop < 0) return "review";
  return "repair";
}

/**
 * Срок окупаемости в годах.
 * В знаменателе только экономия бюджета имущества (закупка + утилизация).
 */
export function paybackYears(
  platformCostKop: number,
  annualPropertySavingKop: number,
): number | null {
  if (!Number.isInteger(platformCostKop) || platformCostKop < 0) {
    throw new Error("Затраты платформы должны быть целым неотрицательным числом");
  }
  if (!Number.isInteger(annualPropertySavingKop)) {
    throw new Error("Годовая экономия должна быть целым числом");
  }
  if (annualPropertySavingKop <= 0) return null;
  return platformCostKop / annualPropertySavingKop;
}
