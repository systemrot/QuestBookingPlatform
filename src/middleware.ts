import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  const isUserOnly =
    path === "/profile" ||
    path.startsWith("/profile/") ||
    path === "/bookings" ||
    path.startsWith("/bookings/");
  const isAdmin = path.startsWith("/admin");

  if (isUserOnly) {
    if (!session?.user) {
      const login = new URL("/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (session.user.role !== "USER") {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }
  }

  if (isAdmin) {
    if (!session?.user) {
      const login = new URL("/login", req.nextUrl.origin);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/bookings",
    "/bookings/:path*",
    "/admin/:path*",
  ],
};
