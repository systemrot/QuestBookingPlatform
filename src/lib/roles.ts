export type AppRole = "USER" | "ADMIN" | "OWNER";

export function isAppRole(role: unknown): role is AppRole {
  return role === "USER" || role === "ADMIN" || role === "OWNER";
}

/** Админ или овнер — доступ к /admin (расписание, чат, отчёты). */
export function isStaff(role: unknown): boolean {
  return role === "ADMIN" || role === "OWNER";
}

/** Только овнер — CRUD квестов и актёров. */
export function isOwner(role: unknown): boolean {
  return role === "OWNER";
}
