/** Presentation parsing for quest blurbs — words stay intact, layout is structured. */

export type QuestDescBlock =
  | { type: "meta"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "ages"; items: string[] }
  | { type: "heading"; text: string }
  | { type: "rule" };

const META_START =
  /^(акция|стоимость|доплата|максимальное|игра до\b|максимальное кол)/i;
const AGE_START = /^\d+\+\s/;
const LIST_START = /^(✨|•|·|- |\* )/;
const CALLOUT_START = /^(❗️|❗|⚠️)/;
const HEADING_START =
  /^(вас ждёт|вас ждет|доступные режимы|🔑|🌟|💥|⏱|👥|🏆|в стоимость|выбирайте свой)/i;
const RULE_LINE = /^[_─–—\-·•\s]{6,}$/;
const CTA_START = /^(📲|не теряйте|отправляйтесь|забронируйте|ждем вас|ждём вас)/i;

function stripListMarker(line: string) {
  return line.replace(/^(✨|•|·)\s*/, "").replace(/^[-*]\s+/, "").trim();
}

function stripCalloutMarker(line: string) {
  return line.replace(/^(❗️|❗|⚠️)\s*/, "").trim();
}

/** First readable plot paragraph for cards / previews. */
export function questDescriptionTeaser(raw: string | null | undefined): string {
  const blocks = parseQuestDescription(raw);
  const plot = blocks.find(
    (b) => b.type === "paragraph" && b.text.length >= 40 && !META_START.test(b.text)
  );
  if (plot && plot.type === "paragraph") return plot.text;
  const any = blocks.find((b) => b.type === "paragraph");
  if (any && any.type === "paragraph") return any.text;
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, 160);
}

export function parseQuestDescription(raw: string | null | undefined): QuestDescBlock[] {
  const text = (raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n").map((l) => l.trimEnd());
  const blocks: QuestDescBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let ages: string[] = [];

  const flushPara = () => {
    const t = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!t) return;
    if (META_START.test(t) || CTA_START.test(t)) {
      blocks.push({ type: "meta", text: t });
    } else if (HEADING_START.test(t) && t.length < 120) {
      blocks.push({ type: "heading", text: t });
    } else {
      blocks.push({ type: "paragraph", text: t });
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", items: [...list] });
      list = [];
    }
  };

  const flushAges = () => {
    if (ages.length) {
      blocks.push({ type: "ages", items: [...ages] });
      ages = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      flushAges();
      flushPara();
      continue;
    }
    if (RULE_LINE.test(line)) {
      flushList();
      flushAges();
      flushPara();
      if (blocks.at(-1)?.type !== "rule") blocks.push({ type: "rule" });
      continue;
    }
    if (LIST_START.test(line)) {
      flushAges();
      flushPara();
      list.push(stripListMarker(line));
      continue;
    }
    if (AGE_START.test(line)) {
      flushList();
      flushPara();
      ages.push(line);
      continue;
    }
    if (CALLOUT_START.test(line)) {
      flushList();
      flushAges();
      flushPara();
      blocks.push({ type: "callout", text: stripCalloutMarker(line) });
      continue;
    }
    if (META_START.test(line) && line.length < 160) {
      flushList();
      flushAges();
      flushPara();
      blocks.push({ type: "meta", text: line });
      continue;
    }
    if (HEADING_START.test(line) && line.length < 100) {
      flushList();
      flushAges();
      flushPara();
      blocks.push({ type: "heading", text: line });
      continue;
    }
    // continuation of list if previous was list and line starts with emoji-ish bullet leftovers
    if (list.length && !/[.!?…]$/.test(list[list.length - 1] ?? "") && line.length < 80) {
      list[list.length - 1] = `${list[list.length - 1]} ${line}`.trim();
      continue;
    }
    flushList();
    flushAges();
    para.push(line);
  }

  flushList();
  flushAges();
  flushPara();
  return blocks;
}
