// src/lib/asyncCache.ts
//
// Fixes a slow-loading pattern found across the services layer: pages load
// data by firing several service methods at once via Promise.all (e.g. the
// dashboard, analytics, and settings pages). Each of those methods
// independently asked "who is the current user?" (a network round trip to
// Supabase's auth server) and, in some cases, re-fetched the exact same
// rows (e.g. all test results) — even though every one of those concurrent
// calls needed the exact same answer at the exact same moment.
//
// createInFlightDeduper() fixes this without changing any method's return
// value or behavior. When two calls for the same key overlap in time, the
// second one is handed the first call's in-flight promise instead of
// starting a brand new network request — so it resolves to the exact same
// result the first call would have produced anyway. As soon as that
// in-flight call settles, the cache entry is removed immediately, so a
// later, separate call still re-runs the underlying function and gets a
// fresh answer. This only removes redundant simultaneous work; it never
// serves stale data.
export function createInFlightDeduper<T>() {
  const inFlight = new Map<string, Promise<T>>();

  return function dedupe(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn().finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);
    return promise;
  };
}