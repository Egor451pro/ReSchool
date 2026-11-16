import { afterEach, describe, expect, it } from "vitest";

/**
 * Поведение singleton-шины (как в bus.ts) — две «копии модуля» делят globalThis.
 */
describe("realtime bus globalThis singleton", () => {
  const key = "__reschoolRealtimeBusTest";

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[key];
  });

  function makeBus() {
    type Listener = (payload: unknown) => void;
    type ChannelMap = Map<string, Set<Listener>>;
    const g = globalThis as unknown as Record<string, ChannelMap | undefined>;
    function channels(): ChannelMap {
      if (!g[key]) g[key] = new Map();
      return g[key]!;
    }
    return {
      subscribe(channel: string, listener: Listener) {
        const map = channels();
        let set = map.get(channel);
        if (!set) {
          set = new Set();
          map.set(channel, set);
        }
        set.add(listener);
        return () => {
          set?.delete(listener);
        };
      },
      publish(channel: string, payload: unknown) {
        const set = channels().get(channel);
        if (!set) return;
        for (const listener of set) listener(payload);
      },
    };
  }

  it("delivers publish from one module copy to subscribe on another", () => {
    const copyA = makeBus();
    const copyB = makeBus();
    const received: unknown[] = [];
    copyA.subscribe("chat:order-1", (payload) => received.push(payload));
    copyB.publish("chat:order-1", { type: "chat", id: "m1" });
    expect(received).toEqual([{ type: "chat", id: "m1" }]);
  });
});
