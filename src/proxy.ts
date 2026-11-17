import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

/** Keep in sync with src/lib/city.ts — do not import city.ts (pulls DB into edge). */
const CITY_COOKIE = "qb_city";

function isCitySlug(value: string): value is "oryol" | "smolensk" {
  return value === "oryol" || value === "smolensk";
}

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  if (path === "/") {
    const cookieCity = req.cookies.get(CITY_COOKIE)?.value;
    const slug = isCitySlug(cookieCity ?? "") ? cookieCity! : "oryol";
    // 307: city depends on cookie — must not be cached as a permanent 308.
    return NextResponse.redirect(new URL(`/${slug}`, req.url), 307);
  }

  const citySeg = path.replace(/^\//, "").split("/")[0] ?? "";
  if (isCitySlug(citySeg)) {
    const res = NextResponse.next();
    // Sync preference only on real document navigations (typed URL, refresh,
    // full page load). Never on <Link> prefetch / RSC prefetch — that was
    // silently flipping qb_city (e.g. admin footer → home jumps to Smolensk).
    const isDocumentNav =
      req.headers.get("sec-fetch-mode") === "navigate" &&
      req.headers.get("sec-fetch-dest") === "document";
    if (
      isDocumentNav &&
      req.cookies.get(CITY_COOKIE)?.value !== citySeg
    ) {
      res.cookies.set(CITY_COOKIE, citySeg, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  }

  const isUserOnly =
    path === "/profile" ||
    path.startsWith("/profile/") ||
    path === "/bookings" ||
    path.startsWith("/bookings/");
  const isAdmin = path.startsWith("/admin");
  const isOwnerOnly =
    path.startsWith("/admin/quests") ||
    path.startsWith("/admin/actors") ||
    path.startsWith("/admin/team");

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
    "/",
    "/oryol",
    "/smolensk",
    "/profile",
    "/profile/:path*",
    "/bookings",
    "/bookings/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
