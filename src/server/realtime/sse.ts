import "server-only";

import { subscribe } from "@/server/realtime/bus";

export function sseResponse(channel: string, init?: { heartbeatMs?: number }) {
  const heartbeatMs = init?.heartbeatMs ?? 20_000;
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("ready", { ok: true });

      unsubscribe = subscribe(channel, (payload) => {
        send("message", payload);
      });

      heartbeat = setInterval(() => {
        send("ping", { t: Date.now() });
      }, heartbeatMs);
    },
    cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
