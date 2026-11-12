import type { CSSProperties } from "react";

type DripSpec = {
  x: number;
  live?: boolean;
  duration?: string;
  delay?: string;
  shape?: 0 | 1 | 2;
  s?: number;
  motion?: "a" | "b" | "c";
  tone?: "deep" | "hot" | "bright";
};

/* Pendant drops: neck at y=0 (attachment), bulb at bottom — not the cartoon tip-down tear. */
const SHAPES = [
  "M0 0 C1.15 0.4 1.7 1.8 1.75 3.6 C1.85 6.2 2.9 8.6 3.15 10.8 C3.35 12.6 2.1 14.2 0 14.2 C-2.1 14.2 -3.35 12.6 -3.15 10.8 C-2.9 8.6 -1.85 6.2 -1.75 3.6 C-1.7 1.8 -1.15 0.4 0 0 Z",
  "M0 0 C0.85 0.5 1.25 2.2 1.3 4.4 C1.4 7.6 2.05 11.2 2.2 14.2 C2.35 16.6 1.35 18.6 0 18.6 C-1.35 18.6 -2.35 16.6 -2.2 14.2 C-2.05 11.2 -1.4 7.6 -1.3 4.4 C-1.25 2.2 -0.85 0.5 0 0 Z",
  "M0 0 C1.4 0.35 2.15 1.6 2.25 3.4 C2.4 5.8 3.5 8.2 3.7 10.4 C3.9 12.4 2.35 14.4 0 14.4 C-2.35 14.4 -3.9 12.4 -3.7 10.4 C-3.5 8.2 -2.4 5.8 -2.25 3.4 C-2.15 1.6 -1.4 0.35 0 0 Z",
] as const;

const VARIANTS: Record<"a" | "b" | "c" | "register", DripSpec[]> = {
  a: [
    { x: 11, s: 0.55, shape: 0, tone: "deep" },
    {
      x: 27,
      live: true,
      duration: "2.9s",
      delay: "0s",
      shape: 1,
      s: 1,
      tone: "hot",
      motion: "a",
    },
    { x: 45, s: 0.48, shape: 2, tone: "deep" },
    {
      x: 67,
      live: true,
      duration: "3.3s",
      delay: "0.55s",
      shape: 0,
      s: 0.9,
      tone: "bright",
      motion: "b",
    },
    { x: 88, s: 0.52, shape: 1, tone: "deep" },
    {
      x: 107,
      live: true,
      duration: "2.7s",
      delay: "1.05s",
      shape: 2,
      s: 1.08,
      tone: "hot",
      motion: "c",
    },
  ],
  b: [
    {
      x: 15,
      live: true,
      duration: "3.1s",
      delay: "0.2s",
      shape: 2,
      s: 1.12,
      tone: "bright",
      motion: "b",
    },
    { x: 38, s: 0.46, shape: 0, tone: "deep" },
    { x: 58, s: 0.58, shape: 1, tone: "deep" },
    {
      x: 81,
      live: true,
      duration: "2.8s",
      delay: "0.75s",
      shape: 1,
      s: 0.88,
      tone: "hot",
      motion: "a",
    },
    {
      x: 105,
      live: true,
      duration: "3.4s",
      delay: "1.25s",
      shape: 0,
      s: 0.95,
      tone: "bright",
      motion: "c",
    },
  ],
  c: [
    { x: 12, s: 0.5, shape: 1, tone: "deep" },
    {
      x: 31,
      live: true,
      duration: "3s",
      delay: "0.1s",
      shape: 0,
      s: 0.92,
      tone: "hot",
      motion: "c",
    },
    { x: 53, s: 0.62, shape: 2, tone: "deep" },
    {
      x: 75,
      live: true,
      duration: "3.2s",
      delay: "0.65s",
      shape: 2,
      s: 1.15,
      tone: "bright",
      motion: "a",
    },
    { x: 96, s: 0.5, shape: 0, tone: "deep" },
    {
      x: 112,
      live: true,
      duration: "2.6s",
      delay: "1.15s",
      shape: 1,
      s: 0.82,
      tone: "hot",
      motion: "b",
    },
  ],
  register: [
    { x: 30, s: 0.45, shape: 0, tone: "deep" },
    {
      x: 56,
      live: true,
      duration: "2.8s",
      delay: "0s",
      shape: 1,
      s: 0.8,
      tone: "hot",
      motion: "a",
    },
    {
      x: 90,
      live: true,
      duration: "3.2s",
      delay: "0.7s",
      shape: 2,
      s: 0.72,
      tone: "bright",
      motion: "c",
    },
  ],
};

export function BloodBrushDrips({
  variant = "a",
}: {
  variant?: keyof typeof VARIANTS;
}) {
  const drips = VARIANTS[variant];
  const uid = `bd-${variant}`;

  return (
    <svg
      className="btn-blood-drips"
      viewBox="0 0 120 48"
      preserveAspectRatio="xMidYMin meet"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={`blood-drip-deep-${uid}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#3f0505" />
          <stop offset="55%" stopColor="#7a0e0e" />
          <stop offset="100%" stopColor="#4a0707" />
        </linearGradient>
        <linearGradient
          id={`blood-drip-hot-${uid}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#6e0a0a" />
          <stop offset="45%" stopColor="#c42828" />
          <stop offset="100%" stopColor="#8a1010" />
        </linearGradient>
        <linearGradient
          id={`blood-drip-bright-${uid}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#7a0c0c" />
          <stop offset="40%" stopColor="#e23a3a" />
          <stop offset="100%" stopColor="#a81818" />
        </linearGradient>
        <radialGradient id={`blood-drip-shine-${uid}`} cx="35%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#ffc9c9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <filter
          id={`blood-drip-glow-${uid}`}
          x="-50%"
          y="-30%"
          width="200%"
          height="180%"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.85" result="b" />
          <feOffset dy="0.7" result="o" />
          <feFlood floodColor="#3a0000" floodOpacity="0.6" />
          <feComposite in2="o" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {drips.map((drip, i) => {
        const gradId =
          drip.tone === "deep"
            ? `blood-drip-deep-${uid}`
            : drip.tone === "bright"
              ? `blood-drip-bright-${uid}`
              : `blood-drip-hot-${uid}`;

        const motionClass = drip.live
          ? `btn-blood-drip btn-blood-drip--live btn-blood-drip--${drip.motion ?? "a"}`
          : "btn-blood-drip";

        return (
          <g
            key={`${variant}-${i}`}
            transform={`translate(${drip.x} 0) scale(${drip.s ?? 1})`}
            filter={drip.live ? `url(#blood-drip-glow-${uid})` : undefined}
          >
            <g
              className={motionClass}
              style={
                {
                  ...(drip.duration
                    ? { ["--drip-duration"]: drip.duration }
                    : null),
                  ...(drip.delay ? { ["--drip-delay"]: drip.delay } : null),
                } as CSSProperties
              }
            >
              <path d={SHAPES[drip.shape ?? 0]} fill={`url(#${gradId})`} />
              {drip.live ? (
                <ellipse
                  cx="-0.7"
                  cy="11.2"
                  rx="1.35"
                  ry="1.7"
                  fill={`url(#blood-drip-shine-${uid})`}
                  pointerEvents="none"
                />
              ) : null}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
