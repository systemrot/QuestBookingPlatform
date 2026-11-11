import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  const isUserOnly =
    path === "/profile" ||
    path.startsWith("/profile/") ||
    path === "/bookings" ||
    path.startsWith("/bookings/");
  const isAdmin = path.startsWith("/admin");
  const isOwnerOnly =
    path.startsWith("/admin/quests") || path.startsWith("/admin/actors");

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
    if (!isStaff(session.user.role)) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    if (isOwnerOnly && session.user.role !== "OWNER") {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
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
    "/admin",
    "/admin/:path*",
  ],
};
