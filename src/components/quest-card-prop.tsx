import Image from "next/image";

/** Corner props: original 3 kept; new ones match the same isolated/black style. */
export const QUEST_PROP_SRC = {
  0: "/brand/props/prop-keys-v3.jpg", // Ключ от всех дверей
  1: "/brand/props/prop-talisman-v3.jpg", // Не дыши
  2: "/brand/props/prop-badge-v3.jpg", // Поворот не туда
  3: "/brand/props/prop-doll-v1.jpg", // Проклятие Аннабель
  4: "/brand/props/prop-film-reel-v1.jpg", // НЕ КИНО
  5: "/brand/props/prop-clown-v1.jpg", // НЕ ПРЯТКИ
  6: "/brand/props/prop-handcuffs-v1.jpg", // НЕ МАФИЯ
  7: "/brand/props/prop-gas-mask-v1.jpg", // Сталкер
  8: "/brand/props/prop-shapes-v1.jpg", // Игра кальмара
} as const;

export type QuestPropVariant = keyof typeof QUEST_PROP_SRC;

/** Map catalog title → corner prop (fallback cycles originals). */
export function propVariantForQuestTitle(title: string): QuestPropVariant {
  const t = title.trim().toLowerCase();
  if (t.includes("ключ")) return 0;
  if (t.includes("не дыши") || t.includes("недыши")) return 1;
  if (t.includes("поворот")) return 2;
  if (t.includes("аннабель")) return 3;
  if (t.includes("не кино") || t.includes("некино")) return 4;
  if (t.includes("прятки")) return 5;
  if (t.includes("мафия")) return 6;
  if (t.includes("сталкер")) return 7;
  if (t.includes("кальмар")) return 8;
  if (t.includes("фото")) return 4;
  if (t.includes("дополнительн")) return 6;
  return 0;
}

export function QuestCardProp({ variant }: { variant: QuestPropVariant }) {
  return (
    <span
      className="quest-card-prop relative block size-[6.75rem] sm:size-[8rem]"
      aria-hidden
    >
      <Image
        src={QUEST_PROP_SRC[variant]}
        alt=""
        fill
        sizes="128px"
        className="object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.95)]"
      />
    </span>
  );
}
