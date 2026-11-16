import "server-only";

type Listener = (payload: unknown) => void;
type ChannelMap = Map<string, Set<Listener>>;

/**
 * Next/Turbopack может загрузить этот модуль дважды (Action vs Route).
 * Без globalThis SSE и publish сидят на разных Map — чат «оживает» только после F5.
 */
const globalForBus = globalThis as unknown as {
  __reschoolRealtimeBus?: ChannelMap;
};

function channels(): ChannelMap {
  if (!globalForBus.__reschoolRealtimeBus) {
    globalForBus.__reschoolRealtimeBus = new Map();
  }
  return globalForBus.__reschoolRealtimeBus;
}

export function chatChannel(orderId: string) {
  return `chat:${orderId}`;
}

export function userChannel(userId: string) {
  return `user:${userId}`;
}

export function subscribe(channel: string, listener: Listener): () => void {
  const map = channels();
  let set = map.get(channel);
  if (!set) {
    set = new Set();
    map.set(channel, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) map.delete(channel);
  };
}

export function publish(channel: string, payload: unknown) {
  const set = channels().get(channel);
  if (!set || set.size === 0) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch {
      // Один подписчик не должен ронять остальных.
    }
  }
}
