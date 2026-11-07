import { describe, expect, it } from "vitest";
import {
  assertOfferAmountKop,
  canConfirmPrice,
  canNegotiatePrice,
  canProposePrice,
  isPriceSystemMessage,
  maxRepairFeeKop,
  priceAcceptedChatBody,
  priceOfferChatBody,
  stripPriceMarker,
} from "./price-deal";

describe("maxRepairFeeKop", () => {
  it("берёт максимум из бюджета и стоимости новых", () => {
    expect(
      maxRepairFeeKop({
        repairBudgetKop: 5_000,
        newUnitPriceKop: 10_000,
        quantity: 1,
      }),
    ).toBe(10_000);
    expect(
      maxRepairFeeKop({
        repairBudgetKop: 12_000,
        newUnitPriceKop: 10_000,
        quantity: 1,
      }),
    ).toBe(12_000);
  });
});

describe("assertOfferAmountKop", () => {
  it("принимает положительную сумму в пределах потолка", () => {
    expect(() => assertOfferAmountKop(1_500, 2_000)).not.toThrow();
  });

  it("отклоняет ноль, отрицательные и сверх потолка", () => {
    expect(() => assertOfferAmountKop(0, 2_000)).toThrow(/больше нуля/);
    expect(() => assertOfferAmountKop(-100, 2_000)).toThrow(/больше нуля/);
    expect(() => assertOfferAmountKop(2_001, 2_000)).toThrow(/выше стоимости/);
  });
});

describe("права торга", () => {
  it("торг только в ASSIGNED без schoolAcceptedAt", () => {
    expect(
      canNegotiatePrice({ orderStatus: "ASSIGNED", schoolAcceptedAt: null }),
    ).toBe(true);
    expect(
      canNegotiatePrice({
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: new Date(),
      }),
    ).toBe(false);
    expect(
      canNegotiatePrice({ orderStatus: "IN_PROGRESS", schoolAcceptedAt: null }),
    ).toBe(false);
  });

  it("предлагать могут мастер и завхоз своего учреждения", () => {
    expect(
      canProposePrice({
        role: "FREELANCER",
        isMaster: true,
        isSchoolStaff: false,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
      }),
    ).toBe(true);
    expect(
      canProposePrice({
        role: "FREELANCER",
        isMaster: false,
        isSchoolStaff: false,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
      }),
    ).toBe(false);
    expect(
      canProposePrice({
        role: "DONOR_STAFF",
        isMaster: false,
        isSchoolStaff: true,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
      }),
    ).toBe(true);
  });

  it("финалить цену может только завхоз при открытой сумме", () => {
    expect(
      canConfirmPrice({
        role: "DONOR_STAFF",
        isSchoolStaff: true,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
        openOfferKop: 2_500,
      }),
    ).toBe(true);
    expect(
      canConfirmPrice({
        role: "FREELANCER",
        isSchoolStaff: false,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
        openOfferKop: 2_500,
      }),
    ).toBe(false);
    expect(
      canConfirmPrice({
        role: "DONOR_STAFF",
        isSchoolStaff: true,
        orderStatus: "ASSIGNED",
        schoolAcceptedAt: null,
        openOfferKop: 0,
      }),
    ).toBe(false);
  });
});

describe("системные сообщения о цене", () => {
  it("помечает и снимает маркер", () => {
    const body = priceOfferChatBody("FREELANCER", 4_500);
    expect(isPriceSystemMessage(body)).toBe(true);
    expect(stripPriceMarker(body)).toMatch(/Фрилансер предложил/);
    expect(isPriceSystemMessage(priceAcceptedChatBody(4_500))).toBe(true);
    expect(isPriceSystemMessage("обычный текст")).toBe(false);
  });
});
