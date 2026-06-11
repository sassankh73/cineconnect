"use client";

// SIGNATURE ELEMENT (design.signature_element):
// Horizontal film-strip ticker of Iranian cinema icons — alternating B&W + color
// portrait frames scrolling like a film strip, with sprocket holes and a film-grain
// overlay, in a smooth infinite CSS loop.
//
// Portraits are rendered as stylized silhouette frames (no third-party photos),
// so it ships self-contained. Swap `Portrait` for real <Image> headshots in prod.

const FRAMES = [
  { name: "بازیگر نقش اول", hue: 28, bw: false },
  { name: "کارگردان", hue: 0, bw: true },
  { name: "فیلمبردار", hue: 200, bw: false },
  { name: "بازیگر زن", hue: 340, bw: true },
  { name: "تدوینگر", hue: 48, bw: false },
  { name: "طراح صدا", hue: 160, bw: true },
  { name: "دوبلور", hue: 280, bw: false },
  { name: "بدلکار", hue: 12, bw: true },
  { name: "طراح لباس", hue: 320, bw: false },
  { name: "نقش مکمل", hue: 90, bw: true },
];

function Portrait({ hue, bw }: { hue: number; bw: boolean }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className="h-full w-full"
      style={{ filter: bw ? "grayscale(1) contrast(1.05)" : "saturate(1.05)" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`g${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 45% 28%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 35% 12%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="120" fill={`url(#g${hue})`} />
      {/* spotlight */}
      <ellipse cx="50" cy="34" rx="46" ry="34" fill="hsl(45 30% 60% / 0.12)" />
      {/* head + shoulders silhouette */}
      <circle cx="50" cy="44" r="20" fill="hsl(45 25% 82% / 0.92)" />
      <path d="M14 120 C14 92 30 78 50 78 C70 78 86 92 86 120 Z" fill="hsl(45 25% 82% / 0.92)" />
    </svg>
  );
}

function Strip() {
  return (
    <>
      {FRAMES.map((f, i) => (
        <div
          key={i}
          className="relative mx-1.5 h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-black/40 bg-black shadow-inner"
        >
          <Portrait hue={f.hue} bw={f.bw} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-3">
            <span className="block truncate text-[8px] font-medium text-gold/90">{f.name}</span>
          </div>
        </div>
      ))}
    </>
  );
}

export function FilmStripTicker() {
  return (
    <div className="film-grain relative overflow-hidden border-y border-gold/20 bg-black py-3">
      {/* sprocket-hole rails */}
      <div className="sprockets pointer-events-none absolute inset-x-0 top-0 h-2 opacity-60" />
      <div className="sprockets pointer-events-none absolute inset-x-0 bottom-0 h-2 opacity-60" />

      {/* infinite marquee — duplicated track translates -50% for a seamless loop */}
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused]">
        <div className="flex">
          <Strip />
        </div>
        <div className="flex" aria-hidden>
          <Strip />
        </div>
      </div>

      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-charcoal to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-charcoal to-transparent" />
    </div>
  );
}
