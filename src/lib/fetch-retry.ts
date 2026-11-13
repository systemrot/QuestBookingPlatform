/** Fetch with short retries — for flaky outbound routes (e.g. Google from RU VPS). */
export async function fetchWithRetry(
  input: string | URL,
  init: RequestInit | undefined,
  opts?: { attempts?: number; timeoutMs?: number; label?: string }
): Promise<Response> {
  const attempts = opts?.attempts ?? 3;
  const timeoutMs = opts?.timeoutMs ?? 12_000;
  const label = opts?.label ?? String(input);
  let last: unknown;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      last = e;
      const code =
        e && typeof e === "object" && "cause" in e
          ? String((e as { cause?: { code?: string } }).cause?.code ?? "")
          : "";
      console.warn(
        `[fetch-retry] ${label} attempt ${i + 1}/${attempts} failed`,
        code || (e instanceof Error ? e.message : e)
      );
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      }
    }
  }

  throw last;
}
