"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import {
  parseQuestDescription,
  type QuestDescBlock,
} from "@/lib/quest-description";
import { cn } from "@/lib/utils";

/** ~2 plot paragraphs visible before expand. */
const COLLAPSED_PX = 132;

/** Story first, price/meta last — same words, better scan order. */
function storyFirst(blocks: QuestDescBlock[]): QuestDescBlock[] {
  const story: QuestDescBlock[] = [];
  const meta: QuestDescBlock[] = [];
  for (const b of blocks) {
    if (b.type === "meta" || b.type === "rule") meta.push(b);
    else story.push(b);
  }
  if (meta.length === 0) return story;
  return [...story, { type: "rule" }, ...meta.filter((b) => b.type !== "rule")];
}

function QuestDescBlocks({ blocks }: { blocks: QuestDescBlock[] }) {
  return (
    <div className="quest-desc space-y-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "rule":
            return (
              <div
                key={i}
                className="my-1 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
                role="separator"
              />
            );
          case "meta":
            return (
              <p
                key={i}
                className="text-[12px] leading-snug text-muted-foreground/75"
              >
                {block.text}
              </p>
            );
          case "heading":
            return (
              <p
                key={i}
                className="pt-0.5 text-[13px] font-medium leading-snug text-foreground/88"
              >
                {block.text}
              </p>
            );
          case "callout":
            return (
              <p
                key={i}
                className="rounded-md border border-blood/25 bg-blood/10 px-3 py-2 text-[13px] font-medium leading-snug text-foreground/90"
              >
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-0">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="relative pl-3.5 text-[13px] leading-snug before:absolute before:left-0 before:top-[0.55em] before:size-1 before:rounded-full before:bg-blood/70"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "ages":
            return (
              <ul
                key={i}
                className="mt-1 space-y-1.5 border-l border-border/70 pl-3"
              >
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-[12.5px] leading-snug text-muted-foreground/90"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "paragraph":
            return (
              <p
                key={i}
                className="text-[13.5px] leading-[1.55] text-muted-foreground"
              >
                {block.text}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

type Props = {
  text: string;
  /** Remeasure when dialog opens / content swaps. */
  measureKey?: string | number | boolean;
  className?: string;
};

export function QuestDescriptionView({ text, measureKey, className }: Props) {
  const blocks = React.useMemo(
    () => storyFirst(parseQuestDescription(text)),
    [text]
  );
  const [expanded, setExpanded] = React.useState(false);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = React.useState(0);

  const measure = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    setFullHeight(el.scrollHeight);
  }, []);

  React.useLayoutEffect(() => {
    setExpanded(false);
    measure();
  }, [text, measureKey, measure]);

  React.useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, text]);

  const needsToggle = fullHeight > COLLAPSED_PX + 16;
  const maxHeight =
    !needsToggle || expanded ? Math.max(fullHeight, COLLAPSED_PX) : COLLAPSED_PX;

  if (blocks.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ maxHeight }}
        aria-expanded={needsToggle ? expanded : undefined}
      >
        <div ref={innerRef}>
          <QuestDescBlocks blocks={blocks} />
        </div>
        {needsToggle && !expanded ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-popover via-popover/70 to-transparent transition-opacity duration-300"
          />
        ) : null}
      </div>

      {needsToggle ? (
        <button
          type="button"
          className={cn(
            "mt-2.5 -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1",
            "text-xs font-medium tracking-wide text-foreground/85",
            "transition-colors duration-200 hover:bg-muted/50 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Свернуть" : "Читать полностью"}
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 opacity-70 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}
