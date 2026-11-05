/** Базовая ставка фрилансера: 14% от стоимости новых изделий в карточке. */
export const FREELANCER_FEE_MILLI = 140;

export function defaultFreelancerFeeKop(
  newUnitPriceKop: number,
  quantity: number,
): number {
  if (!Number.isInteger(newUnitPriceKop) || newUnitPriceKop < 0) {
    throw new Error("Цена новой единицы должна быть целым неотрицательным числом");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Количество должно быть целым числом не меньше 1");
  }
  return Math.round((newUnitPriceKop * quantity * FREELANCER_FEE_MILLI) / 1000);
}
