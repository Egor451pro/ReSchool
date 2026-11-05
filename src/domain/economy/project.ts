import { calculateItemEconomy, paybackYears } from "./calculate";
import { assertIntInRange } from "./money";
import type { YearProjection, YearProjectionInput } from "./types";

/**
 * Годовой сценарий по среднему предмету и доле заказов, дошедших до выдачи.
 * Это прогноз по допущениям, а не сумма уже закрытых заказов.
 */
export function projectYear(input: YearProjectionInput): YearProjection {
  assertIntInRange("expectedListedPerYear", input.expectedListedPerYear, 0);
  assertIntInRange("completionMilli", input.completionMilli, 0, 1000);
  assertIntInRange("hostingKopAnnual", input.hostingKopAnnual, 0);
  assertIntInRange("supportKopAnnual", input.supportKopAnnual, 0);

  const completedOrders = Math.round(
    (input.expectedListedPerYear * input.completionMilli) / 1000,
  );
  const perItem = calculateItemEconomy({
    quantity: 1,
    newUnitPriceKop: input.avgNewPriceKop,
    materialsKop: input.avgMaterialsKop,
    transportKop: input.defaultTransportKop,
    disposalPerUnitKop: input.avgDisposalKop,
    practiceConsumableKop: input.practiceConsumableKop,
    substitutionMilli: input.substitutionMilli,
  });
  const propertyBudgetKop = perItem.propertyBudgetKop * completedOrders;
  const practiceSavingKop = perItem.practiceSavingKop * completedOrders;
  const platformCostKop = input.hostingKopAnnual + input.supportKopAnnual;

  return {
    completedOrders,
    perItem,
    propertyBudgetKop,
    practiceSavingKop,
    combinedKop: propertyBudgetKop + practiceSavingKop,
    platformCostKop,
    paybackYears: paybackYears(platformCostKop, propertyBudgetKop),
  };
}
