import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Any route whose path starts with one of these prefixes requires a logged-in
// user. Add a new entry here whenever a new page's services call
// authService.getCurrentUser() / getUserId() under the hood — otherwise the
// page will render but its data calls will fail with "User not authenticated".
//
// This list covers both UI pages AND API routes. API routes are included here
// because they call the Gemini API using a server-side key — without auth
// protection, anyone (even without an account) could hit these endpoints
// directly and burn through the API quota.
const PROTECTED_PREFIXES = [
  // --- Pages ---
  '/dashboard',
  '/audio',
  '/my-notes',
  '/notes',
  '/video-to-notes',
  '/library',
  '/mentors',
  '/mentor',
  '/mock-tests',
  '/mock-test-assistant', // calls testService.getAllResults() same as the other test-related pages — was missing from this list
  '/pyqs',
  '/practice',
  '/planner',
  '/memory',
  '/coding-mentor',
  '/writing-assistant', // fixed typo: was '/writting-assistant', which never matched the real route and left this page unprotected
  '/analytics',
  '/settings',

  // --- API routes (Gemini-backed, must not be publicly callable) ---
  '/api/ai-tutor',
  '/api/book-tools',
  '/api/code-mentor',
  '/api/generate-notes',
  '/api/generate-practice',
  '/api/mock-test-analysis',
  '/api/video-notes',
  '/api/writing-assistant',
  // Note: '/api/text-to-audio' intentionally NOT listed here — it's dead code,
  // never called by the frontend. The live Text-to-Speech feature speaks
  // directly in the browser via window.speechSynthesis (see
  // src/features/text-to-audio/components/AudioPlayer.tsx). Recommend
  // deleting src/app/api/text-to-audio/route.ts, services/ttsService.ts, and
  // hooks/useAudioPlayer.ts as unused cleanup.
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session refresh karne ke liye
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Agar user logged in nahi hai aur kisi protected page/API ko access karne
  // ki koshish kare toh block kar do.
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!user && isProtected) {
    // API routes should get a 401 JSON response, not a redirect — a redirect
    // would send fetch() calls to the login page's HTML instead of failing
    // cleanly, which is confusing for the frontend code calling these routes.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'You must be logged in to use this feature.' },
        { status: 401 }
      )
    }

    // Pages: redirect to /login, remembering where they were headed so
    // /login (and, after signup, the eventual /login link) can send them
    // straight back there instead of dumping them on /dashboard.
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}