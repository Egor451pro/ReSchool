import { describe, expect, it } from "vitest";
import { defaultFreelancerFeeKop, suggestedClaimFeeKop } from "./fee";

describe("defaultFreelancerFeeKop", () => {
  it("считает 14% от стоимости новых изделий", () => {
    // Стул 47 BYN → 6,58 BYN
    expect(defaultFreelancerFeeKop(4_700, 1)).toBe(658);
    // 4 парты по 180 BYN → 100,80 BYN
    expect(defaultFreelancerFeeKop(18_000, 4)).toBe(10_080);
  });
});

describe("suggestedClaimFeeKop", () => {
  it("берёт бюджет школы, если он задан", () => {
    expect(
      suggestedClaimFeeKop({
        repairBudgetKop: 2_500,
        newUnitPriceKop: 18_000,
        quantity: 1,
      }),
    ).toBe(2_500);
  });

  it("иначе считает 14%", () => {
    expect(
      suggestedClaimFeeKop({
        repairBudgetKop: 0,
        newUnitPriceKop: 18_000,
        quantity: 1,
      }),
    ).toBe(2_520);
  });
});
