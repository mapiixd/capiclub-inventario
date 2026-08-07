import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/products",
  "/inventory",
  "/purchases",
  "/sales",
  "/cash",
];

export function middleware(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = request.cookies.get("capiclub_session");

  if (!session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/cash/:path*",
  ],
};
