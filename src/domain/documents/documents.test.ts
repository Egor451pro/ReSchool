import { describe, expect, it } from "vitest";
import {
  buildTransferActPayload,
  buildWriteOffPayload,
  DRAFT_WATERMARK,
  formatActNumber,
  isReturnAct,
  parseActSerial,
} from "./index";

describe("номера актов", () => {
  it("форматирует серийный номер", () => {
    expect(formatActNumber(1)).toBe("РС-2026-0001");
    expect(formatActNumber(10)).toBe("РС-2026-0010");
  });

  it("разбирает серийный номер", () => {
    expect(parseActSerial("РС-2026-0007")).toBe(7);
    expect(parseActSerial("ACT-1")).toBeNull();
  });
});

describe("payload актов", () => {
  it("собирает акт возврата/передачи с водяным знаком", () => {
    const payload = buildTransferActPayload({
      title: "Парты",
      quantity: 4,
      materialsKop: 4000,
      transportKop: 1500,
      fromName: "Школа №1",
      toName: "Школа №1",
    });
    expect(payload.watermark).toBe(DRAFT_WATERMARK);
    expect(payload.quantity).toBe(4);
    expect(payload.synthetic).toBe(false);
  });

  it("собирает черновик списания", () => {
    const payload = buildWriteOffPayload({ title: "Станок" });
    expect(payload.reason).toMatch(/нецелесообразным/);
    expect(payload.watermark).toBe(DRAFT_WATERMARK);
  });

  it("отличает возврат от передачи", () => {
    expect(isReturnAct("a", "a")).toBe(true);
    expect(isReturnAct("a", "b")).toBe(false);
  });
});
