export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warmDatabase } = await import("@/lib/prisma");
    // Один SELECT 1 при старте — без фонового интервала (он жрал слоты pooler).
    void warmDatabase();
  }
}
