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
  assertIntInRange("freelancerFeeKop", input.freelancerFeeKop, 0);
  assertIntInRange("disposalPerUnitKop", input.disposalPerUnitKop, 0);
  assertIntInRange("practiceConsumableKop", input.practiceConsumableKop, 0);
  assertIntInRange("substitutionMilli", input.substitutionMilli, 0, 1000);
}

const MAX_RUBLES = 10_000_000;

export function formatBynAmount(kop: number): string {
  if (!Number.isInteger(kop)) {
    throw new Error("Сумма в копейках должна быть целым числом");
  }

  const sign = kop < 0 ? "−" : "";
  const abs = Math.abs(kop);
  const rubles = Math.floor(abs / 100);
  const kopecks = abs % 100;
  const grouped = rubles.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped},${kopecks.toString().padStart(2, "0")}`;
}

export function formatByn(kop: number): string {
  return `${formatBynAmount(kop)} BYN`;
}

/** Разбирает ввод завхоза: «180», «180,50», «1 800.5». */
export function parseBynToKop(raw: string): number {
  const cleaned = raw.trim().replace(/[\s\u00a0]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error("Цена в белорусских рублях, не больше двух знаков после запятой");
  }

  const [rublesText, fraction = ""] = cleaned.split(".");
  const rubles = Number(rublesText);
  if (rubles > MAX_RUBLES) {
    throw new Error("Цена слишком большая");
  }

  return rubles * 100 + Number(fraction.padEnd(2, "0"));
}
