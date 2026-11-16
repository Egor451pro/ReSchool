import "server-only";

type Listener = (payload: unknown) => void;

const channels = new Map<string, Set<Listener>>();

export function chatChannel(orderId: string) {
  return `chat:${orderId}`;
}

export function userChannel(userId: string) {
  return `user:${userId}`;
}

export function subscribe(channel: string, listener: Listener): () => void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(channel);
  };
}

export function publish(channel: string, payload: unknown) {
  const set = channels.get(channel);
  if (!set || set.size === 0) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch {
      // Один подписчик не должен ронять остальных.
    }
  }
}
