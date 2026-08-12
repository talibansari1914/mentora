import { createBrowserClient } from '@supabase/ssr'

// Single cookie-aware browser client, memoized so every caller shares the
// exact same auth session (and thus the same cookies) instead of each
// getting its own isolated client.
let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

// Backward compatibility for services that import `{ supabase }` directly
// instead of calling createClient(). This now points at the SAME singleton
// instance as createClient() — previously this was a second, disconnected
// client created via plain @supabase/supabase-js, which stored its session
// in a different place than the cookie-based session authService/middleware
// use. That mismatch is what caused "User not logged in" on the dashboard
// even right after a successful login.
export const supabase = createClient()