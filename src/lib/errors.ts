// ============================================================================
// src/lib/errors.ts
//
// Centralizes the "what string do I show the user when a try/catch fails"
// logic that used to be duplicated ad-hoc across ~50 call sites as
// `catch (err: any) { setError(err.message ?? "...") }` or
// `(err as any)?.message ?? err?.code ?? String(err)`.
//
// Behavior is unchanged from what those call sites already did — this only
// gives it one typed, tested implementation instead of many untyped copies.
// ============================================================================

/**
 * Safely extracts a human-readable message from a thrown value of unknown
 * shape (Error, Supabase PostgrestError, a plain string, or something
 * unexpected), falling back to `fallback` if nothing usable is found.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof Error && err.message) return err.message;

  if (typeof err === "string" && err) return err;

  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; error?: unknown; code?: unknown };
    if (typeof maybe.message === "string" && maybe.message) return maybe.message;
    if (typeof maybe.error === "string" && maybe.error) return maybe.error;
    if (typeof maybe.code === "string" && maybe.code) return maybe.code;
  }

  return fallback;
}