import { describe, expect, it } from "vitest";
import { defaultFreelancerFeeKop } from "./fee";

describe("defaultFreelancerFeeKop", () => {
  it("считает 14% от стоимости новых изделий", () => {
    // Стул 47 BYN → 6,58 BYN
    expect(defaultFreelancerFeeKop(4_700, 1)).toBe(658);
    // 4 парты по 180 BYN → 100,80 BYN
    expect(defaultFreelancerFeeKop(18_000, 4)).toBe(10_080);
  });
});
