import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/error", "/"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Auth API routes should always be accessible
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // For now, allow all routes - auth will be checked server-side
  // This avoids Edge Runtime issues with Mongoose
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
