import type { ItemEconomyInput } from "./types";

export function assertIntInRange(
  name: string,
  value: number,
  min: number,
  max?: number,
): void {
  if (!Number.isInteger(value) || value < min || (max !== undefined && value > max)) {
    const ceiling = max === undefined ? "" : ` и не больше ${max}`;
    throw new Error(`${name} должно быть целым числом не меньше ${min}${ceiling}`);
  }
}

export function assertEconomyInput(input: ItemEconomyInput): void {
  assertIntInRange("quantity", input.quantity, 1);
  assertIntInRange("newUnitPriceKop", input.newUnitPriceKop, 0);
  assertIntInRange("materialsKop", input.materialsKop, 0);
  assertIntInRange("transportKop", input.transportKop, 0);
  assertIntInRange("disposalPerUnitKop", input.disposalPerUnitKop, 0);
  assertIntInRange("practiceConsumableKop", input.practiceConsumableKop, 0);
  assertIntInRange("substitutionMilli", input.substitutionMilli, 0, 1000);
}

export function formatByn(kop: number): string {
  if (!Number.isInteger(kop)) {
    throw new Error("Сумма в копейках должна быть целым числом");
  }

  const sign = kop < 0 ? "−" : "";
  const abs = Math.abs(kop);
  const rubles = Math.floor(abs / 100);
  const kopecks = abs % 100;
  const grouped = rubles.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped},${kopecks.toString().padStart(2, "0")} BYN`;
}
