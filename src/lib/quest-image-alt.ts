const IMAGE_ALT_MIN = 8;
const IMAGE_ALT_MAX = 120;

const BANNED_EXACT =
  /^(фото|картинка|рисунок|image|photo|img|pic|picture)(\s*[#№]?\s*\d+)?$/i;

/** Empty is OK (runtime fallback). Non-empty must pass these rules. */
export function normalizeQuestImageAlt(raw: string): string | null {
  const alt = raw.trim().replace(/\s+/g, " ");
  return alt.length > 0 ? alt : null;
}

export function validateQuestImageAlt(
  raw: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const value = normalizeQuestImageAlt(raw);
  if (value == null) return { ok: true, value: null };

  if (value.length < IMAGE_ALT_MIN) {
    return {
      ok: false,
      error: `Alt слишком короткий (минимум ${IMAGE_ALT_MIN} символов) или оставьте поле пустым.`,
    };
  }
  if (value.length > IMAGE_ALT_MAX) {
    return {
      ok: false,
      error: `Alt не длиннее ${IMAGE_ALT_MAX} символов.`,
    };
  }
  if (BANNED_EXACT.test(value)) {
    return {
      ok: false,
      error: "Укажите, что на фото (сценарий/атмосфера), а не «фото» / «image».",
    };
  }
  if (/^https?:\/\//i.test(value) || value.includes("/") || value.includes("\\")) {
    return {
      ok: false,
      error: "Alt — текст для людей, не URL и не путь к файлу.",
    };
  }

  return { ok: true, value };
}

/** Used on the site when imageAlt is empty. */
export function fallbackQuestImageAlt(title: string, cityName?: string | null) {
  const name = title.trim() || "Квест";
  const city = cityName?.trim();
  return city ? `${name} — квест в городе ${city}` : `${name} — квест`;
}

export const QUEST_IMAGE_ALT_HINT =
  "Коротко опишите, что на обложке: название сценария и атмосфера. Пример: «Интерьер квеста „Не дыши“ — тёмная фабрика». Можно оставить пустым — подставим название и город.";

export { IMAGE_ALT_MAX };
