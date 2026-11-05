import { describe, expect, it } from "vitest";
import { sumSnapshots } from "./aggregate";
import { calculateItemEconomy, paybackYears } from "./calculate";
import { formatByn, parseBynToKop } from "./money";
import { projectYear } from "./project";

describe("calculateItemEconomy", () => {
  it("считает партию парт по формуле бюджета имущества", () => {
    const result = calculateItemEconomy({
      quantity: 4,
      newUnitPriceKop: 18_000,
      materialsKop: 4_000,
      transportKop: 1_500,
      disposalPerUnitKop: 800,
      practiceConsumableKop: 2_500,
      substitutionMilli: 700,
    });

    expect(result).toMatchObject({
      newPriceKop: 72_000,
      restorationKop: 5_500,
      procurementSavingKop: 66_500,
      avoidedDisposalKop: 3_200,
      propertyBudgetKop: 69_700,
      practiceSavingKop: 1_750,
      combinedKop: 71_450,
      worthRepairing: true,
      advice: "repair",
    });
  });

  it("оставляет отрицательную экономию закупки видимой", () => {
    const result = calculateItemEconomy({
      quantity: 1,
      newUnitPriceKop: 3_000,
      materialsKop: 2_800,
      transportKop: 1_500,
      disposalPerUnitKop: 800,
      practiceConsumableKop: 2_500,
      substitutionMilli: 700,
    });

    expect(result.procurementSavingKop).toBe(-1_300);
    expect(result.propertyBudgetKop).toBe(-500);
    expect(result.advice).toBe("dispose");
    expect(result.worthRepairing).toBe(false);
  });

  it("помечает случай, где ремонт вытягивает только утилизация", () => {
    const result = calculateItemEconomy({
      quantity: 1,
      newUnitPriceKop: 5_000,
      materialsKop: 4_000,
      transportKop: 1_500,
      disposalPerUnitKop: 800,
      practiceConsumableKop: 0,
      substitutionMilli: 0,
    });

    expect(result.procurementSavingKop).toBe(-500);
    expect(result.propertyBudgetKop).toBe(300);
    expect(result.advice).toBe("review");
  });

  it("отклоняет нулевое количество и коэффициент вне диапазона", () => {
    expect(() =>
      calculateItemEconomy({
        quantity: 0,
        newUnitPriceKop: 100,
        materialsKop: 0,
        transportKop: 0,
        disposalPerUnitKop: 0,
        practiceConsumableKop: 0,
        substitutionMilli: 0,
      }),
    ).toThrow(/quantity/);

    expect(() =>
      calculateItemEconomy({
        quantity: 1,
        newUnitPriceKop: 100,
        materialsKop: 0,
        transportKop: 0,
        disposalPerUnitKop: 0,
        practiceConsumableKop: 0,
        substitutionMilli: 1001,
      }),
    ).toThrow(/substitutionMilli/);
  });
});

describe("paybackYears", () => {
  it("делит годовые затраты на экономию бюджета имущества", () => {
    expect(paybackYears(100_000, 200_000)).toBe(0.5);
  });

  it("не делит на ноль и на отрицательную экономию", () => {
    expect(paybackYears(100_000, 0)).toBeNull();
    expect(paybackYears(100_000, -1)).toBeNull();
  });
});

describe("projectYear", () => {
  it("собирает базовый сценарий из среднего предмета и доли закрытия", () => {
    const projection = projectYear({
      expectedListedPerYear: 180,
      avgNewPriceKop: 25_000,
      avgMaterialsKop: 4_000,
      avgDisposalKop: 933,
      defaultTransportKop: 1_500,
      practiceConsumableKop: 2_500,
      substitutionMilli: 700,
      completionMilli: 450,
      hostingKopAnnual: 20_000,
      supportKopAnnual: 80_000,
    });

    expect(projection.completedOrders).toBe(81);
    expect(projection.perItem.propertyBudgetKop).toBe(20_433);
    expect(projection.propertyBudgetKop).toBe(81 * 20_433);
    expect(projection.practiceSavingKop).toBe(81 * 1_750);
    expect(projection.platformCostKop).toBe(100_000);
    expect(projection.paybackYears).toBeCloseTo(100_000 / (81 * 20_433), 10);
  });
});

describe("sumSnapshots", () => {
  it("суммирует факт и не пересчитывает его новыми допущениями", () => {
    const totals = sumSnapshots([
      {
        procurementSavingKop: 100,
        avoidedDisposalKop: 20,
        propertyBudgetKop: 120,
        practiceSavingKop: 10,
        minutes: 60,
      },
      {
        procurementSavingKop: -50,
        avoidedDisposalKop: 30,
        propertyBudgetKop: -20,
        practiceSavingKop: 15,
        minutes: 30,
      },
    ]);

    expect(totals).toEqual({
      orders: 2,
      procurementSavingKop: 50,
      avoidedDisposalKop: 50,
      propertyBudgetKop: 100,
      practiceSavingKop: 25,
      combinedKop: 125,
      minutes: 90,
    });
  });
});

describe("parseBynToKop", () => {
  it("принимает рубли с запятой, точкой и пробелом", () => {
    expect(parseBynToKop("180")).toBe(18_000);
    expect(parseBynToKop("180,5")).toBe(18_050);
    expect(parseBynToKop("180.50")).toBe(18_050);
    expect(parseBynToKop("1 800,00")).toBe(180_000);
  });

  it("отклоняет лишние знаки и отрицательную цену", () => {
    expect(() => parseBynToKop("180,555")).toThrow(/двух знаков/);
    expect(() => parseBynToKop("-1")).toThrow(/рублях/);
    expect(() => parseBynToKop("")).toThrow(/рублях/);
  });
});

describe("formatByn", () => {
  it("группирует рубли и сохраняет знак", () => {
    expect(formatByn(69_700)).toBe("697,00 BYN");
    expect(formatByn(1_655_073)).toBe("16 550,73 BYN");
    expect(formatByn(-500)).toBe("−5,00 BYN");
  });
});
