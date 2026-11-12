import Image from "next/image";

const PROP_SRC = {
  0: "/brand/props/prop-keys-v3.jpg",
  1: "/brand/props/prop-talisman-v3.jpg",
  2: "/brand/props/prop-badge-v3.jpg",
} as const;

/** Corner props matching the reference: keys / padlock / sheriff star. */
export function QuestCardProp({ variant }: { variant: 0 | 1 | 2 }) {
  return (
    <span
      className="quest-card-prop relative block size-[6.75rem] sm:size-[8rem]"
      aria-hidden
    >
      <Image
        src={PROP_SRC[variant]}
        alt=""
        fill
        sizes="128px"
        className="object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.95)]"
      />
    </span>
  );
}
