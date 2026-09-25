import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const requestCookies = request.cookies.getAll();

  for (const cookie of requestCookies) {
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run middleware on application routes while excluding:
     * - Next.js internals
     * - static assets
     * - favicon
     * - common image/font files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
