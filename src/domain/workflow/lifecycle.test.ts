import { describe, expect, it } from "vitest";
import { assertItemTransition } from "./item-lifecycle";
import { assertOrderTransition } from "./order-lifecycle";

describe("конвейер предмета", () => {
  it("пропускает соседние статусы демо-сценария", () => {
    expect(() => assertItemTransition("LISTED", "REQUESTED")).not.toThrow();
    expect(() => assertItemTransition("REQUESTED", "IN_REPAIR")).not.toThrow();
    expect(() => assertItemTransition("IN_REPAIR", "READY")).not.toThrow();
    expect(() => assertItemTransition("READY", "DELIVERED")).not.toThrow();
    expect(() => assertItemTransition("DELIVERED", "CLOSED", "COMPLETED")).not.toThrow();
  });

  it("запрещает перескок статуса", () => {
    expect(() => assertItemTransition("LISTED", "READY")).toThrow(/Недопустимый переход/);
    expect(() => assertItemTransition("CLOSED", "LISTED")).toThrow(/Недопустимый переход/);
  });

  it("требует причину закрытия, соответствующую шагу", () => {
    expect(() => assertItemTransition("LISTED", "CLOSED", "WITHDRAWN")).not.toThrow();
    expect(() => assertItemTransition("IN_REPAIR", "CLOSED", "UNREPAIRABLE")).not.toThrow();
    expect(() => assertItemTransition("LISTED", "CLOSED", "COMPLETED")).toThrow(/WITHDRAWN/);
    expect(() => assertItemTransition("REQUESTED", "CLOSED", "WITHDRAWN")).toThrow(
      /Недопустимый переход/,
    );
    expect(() => assertItemTransition("READY", "DELIVERED", "COMPLETED")).toThrow(
      /Причина закрытия/,
    );
  });
});

describe("конвейер заказа", () => {
  it("ведёт заказ от назначения до закрытия и разрешает отказ до проверки качества", () => {
    expect(() => assertOrderTransition("ASSIGNED", "IN_PROGRESS")).not.toThrow();
    expect(() => assertOrderTransition("IN_PROGRESS", "CANCELLED")).not.toThrow();
    expect(() => assertOrderTransition("QUALITY_CHECK", "COMPLETED")).not.toThrow();
  });

  it("не даёт закрыть заказ, минуя проверку качества", () => {
    expect(() => assertOrderTransition("ASSIGNED", "COMPLETED")).toThrow(
      /Недопустимый переход/,
    );
    expect(() => assertOrderTransition("COMPLETED", "CANCELLED")).toThrow(
      /Недопустимый переход/,
    );
  });
});
