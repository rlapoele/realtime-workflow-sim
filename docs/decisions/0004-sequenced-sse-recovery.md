# ADR 0004: Snapshot-first sequenced SSE recovery

- Status: accepted
- Date: 2026-10-12

## Context

Phase 3 used short-interval polling to inspect authoritative execution snapshots. Phase 4 requires progressive logs and status changes without missing or duplicating text when a stream connects late, reconnects, races an HTTP response, or receives duplicate or out-of-order events.

The backend remains single-process and in-memory. A reconnect can therefore read current state directly instead of persisting and replaying an event history.

## Decision

`GET /workflows/stream?executionId=...` is a named Server-Sent Events stream for exactly one retained execution.

- The service subscribes to that execution's multicast source before capturing its initial state, buffers any intervening live events, sends one `execution.snapshot`, and then releases only events newer than the snapshot sequence.
- State-changing events have a monotonically increasing per-execution sequence. SSE `event` uses the discriminant and SSE `id` uses the sequence. Heartbeats are named but unsequenced because they do not mutate state.
- Reconnecting clients receive a current snapshot, not historical `log.delta` replay. A terminal retained execution sends one terminal snapshot and closes immediately.
- Live streams finish only after all log deltas, step statuses, skipped statuses, and the terminal execution status have been emitted. Disconnect teardown releases the subscription and heartbeat without cancelling the simulation.
- The frontend uses one execution-scoped TanStack Query key. `log.delta` updates cached text immutably without a GET. Status events update the cache and invalidate only that execution query. Heartbeats do not invalidate anything.
- The reducer ignores duplicate and older sequences. A gap pauses newer deltas until `GET /executions/:executionId` supplies an authoritative snapshot. Snapshots older than the cached sequence are rejected, including late HTTP responses.
- The EventSource effect closes and removes listeners on unmount, execution-ID change, and terminal completion. The same cleanup makes React development Strict Mode setup/cleanup cycles safe.

## Consequences

- Stream recovery is bounded by the current in-memory snapshot and does not require an event store.
- The backend is authoritative; client sequence logic prevents cache timing from becoming a second source of truth.
- A backend restart still expires the execution, as specified for this prototype.
- Multiple replicas remain out of scope because their in-memory execution maps and multicast sources are not shared.

## Sources

- NestJS Server-Sent Events: <https://docs.nestjs.com/techniques/server-sent-events>
- TanStack Query query invalidation: <https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation>
- TanStack Query `setQueryData`: <https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientsetquerydata>
- React effect lifecycle and cleanup: <https://react.dev/reference/react/useEffect#connecting-to-an-external-system>
- MDN EventSource and named event behavior: <https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events>
