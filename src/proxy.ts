import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

/** Keep in sync with src/lib/city-slug.ts — do not import city.ts (pulls DB into edge). */
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
    const hasCityPref = isCitySlug(cookieCity ?? "");
    const slug = hasCityPref ? cookieCity! : "oryol";
    // No cookie (Googlebot / first visit): 301 → default city so `/` consolidates in search.
    // With cookie: 307 → chosen city (must not be cached as permanent for the wrong city).
    return NextResponse.redirect(
      new URL(`/${slug}`, req.url),
      hasCityPref ? 307 : 301
    );
  }

  // City preference is written only by selectCity / CityNavLink — never here.
  // URL visits must not mutate qb_city (prefetch and soft-nav races).
  const citySeg = path.replace(/^\//, "").split("/")[0] ?? "";
  if (isCitySlug(citySeg)) {
    return NextResponse.next();
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
      const cookieCity = req.cookies.get(CITY_COOKIE)?.value;
      const slug = isCitySlug(cookieCity ?? "") ? cookieCity! : "oryol";
      return NextResponse.redirect(new URL(`/${slug}`, req.nextUrl.origin));
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
