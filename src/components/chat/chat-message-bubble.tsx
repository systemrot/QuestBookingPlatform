import { cn } from "@/lib/utils";
import { formatRu } from "@/lib/locale";

type Props = {
  text: string;
  createdAt: string;
  /** Сообщение текущего пользователя интерфейса (клиент или админ). */
  variant: "outgoing" | "incoming";
  label?: string;
  pending?: boolean;
};

export function ChatMessageBubble({
  text,
  createdAt,
  variant,
  label,
  pending = false,
}: Props) {
  const isOutgoing = variant === "outgoing";

  return (
    <div
      className={cn(
        "flex max-w-[88%] flex-col gap-1",
        isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      {label ? (
        <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm transition-opacity",
          isOutgoing
            ? "rounded-br-md border border-white/15 bg-white/10 text-foreground backdrop-blur-sm"
            : "rounded-bl-md border border-success/25 bg-success/10 text-foreground",
          pending && "opacity-60"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
      <time
        className="px-1 text-[10px] text-muted-foreground"
        dateTime={createdAt}
      >
        {pending ? "Отправка…" : formatRu(new Date(createdAt), "d MMM, HH:mm")}
      </time>
    </div>
  );
}
