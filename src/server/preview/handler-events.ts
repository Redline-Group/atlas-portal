// The SSE transport of GET /api/preview/:id/events. What the stream says is
// decided by drive() (handler-drive.ts).

import type { PreviewEvent } from "./build.ts";
import { PREVIEW_CORS } from "../http.ts";
import { drive } from "./handler-drive.ts";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
  ...PREVIEW_CORS,
};

// A client cancel/close can land before the async unsubscribe fn is known
// (drive() hasn't resolved yet). Naively assigning `unsub = u` in the .then()
// loses a cancel that already fired against the stale initial noop, leaking
// the subscriber (a dead `send` stays in Inflight.subscribers until the build
// ends). This gate makes "cancel then resolve" and "resolve then cancel" both
// invoke the real unsubscribe exactly once. Exported for the race regression
// test; otherwise internal to eventsResponse.
export function makeUnsubGate(): { resolve: (u: () => void) => void; cancel: () => void } {
  let unsub: (() => void) | null = null;
  let cancelled = false;
  return {
    resolve(u) {
      if (cancelled) {
        u();
        return;
      }
      unsub = u;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      unsub?.();
    },
  };
}

type Gate = ReturnType<typeof makeUnsubGate>;

/** The stream's `send`: writes one event and closes on a terminal phase. */
function sseSender(controller: ReadableStreamDefaultController, gate: Gate): (ev: PreviewEvent) => void {
  const enc = new TextEncoder();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    gate.cancel();
    try {
      controller.close();
    } catch {
      /* already closed */
    }
  };
  return (ev) => {
    try {
      controller.enqueue(enc.encode(`event: preview\ndata: ${JSON.stringify(ev)}\n\n`));
    } catch {
      /* downstream gone */
    }
    if (ev.phase === "ready" || ev.phase === "failed") close();
  };
}

export function eventsResponse(req: Request, rawId: string, ip: string): Response {
  const gate = makeUnsubGate();
  const stream = new ReadableStream({
    start(controller) {
      void drive(req, rawId, ip, sseSender(controller, gate)).then((u) => gate.resolve(u));
    },
    cancel() {
      gate.cancel();
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
