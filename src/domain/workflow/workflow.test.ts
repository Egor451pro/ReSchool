import { describe, expect, it } from "vitest";
import { distanceKm, formatDistanceKm } from "./distance";
import {
  planCloseCompleted,
  planOrderAdvance,
  planOrderCancel,
  planUnrepairable,
} from "./order-item-sync";

describe("синхронизация заказа и предмета", () => {
  it("ведёт пару статусов по демо-конвейеру", () => {
    expect(planOrderAdvance("ASSIGNED", "REQUESTED")).toMatchObject({
      orderTo: "IN_PROGRESS",
      itemTo: "IN_REPAIR",
    });
    expect(planOrderAdvance("IN_PROGRESS", "IN_REPAIR")).toMatchObject({
      orderTo: "COMPLETED",
      itemTo: "READY",
    });
    expect(planOrderAdvance("QUALITY_CHECK", "IN_REPAIR")).toMatchObject({
      orderTo: "COMPLETED",
      itemTo: "READY",
    });
  });

  it("возвращает карточку в каталог при отказе", () => {
    expect(planOrderCancel("ASSIGNED", "REQUESTED")).toMatchObject({
      orderTo: "CANCELLED",
      itemTo: "LISTED",
    });
    expect(planOrderCancel("IN_PROGRESS", "IN_REPAIR").itemTo).toBe("LISTED");
  });

  it("переводит предмет на сдачу в утиль после начала ремонта", () => {
    expect(planUnrepairable("IN_REPAIR", "IN_PROGRESS")).toMatchObject({
      orderTo: "CANCELLED",
      itemTo: "DISPOSAL_PENDING",
      closeReason: "UNREPAIRABLE",
    });
    expect(() => planUnrepairable("REQUESTED", "ASSIGNED")).toThrow(/начатый ремонт/);
  });

  it("закрывает переданный предмет со снимком", () => {
    expect(planCloseCompleted("DELIVERED")).toMatchObject({
      itemTo: "CLOSED",
      closeReason: "COMPLETED",
    });
    expect(() => planCloseCompleted("READY")).toThrow(/Недопустимый переход/);
  });
});

describe("расстояние", () => {
  it("считает километры между точками пилота", () => {
    const km = distanceKm({ lat: 53.908, lng: 27.548 }, { lat: 53.92, lng: 27.56 });
    expect(km).toBeGreaterThan(1);
    expect(km).toBeLessThan(3);
    expect(formatDistanceKm(0.35)).toBe("350 м");
  });
});
