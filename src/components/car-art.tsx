import { useId, useRef, useState } from "react";
import { MAKE_COLORS } from "@/lib/market/data";

type Visual = { kind: "photo"; src: string } | { kind: "art"; frame: number };

export function CarArt({ make, frame }: { make: string; frame: number }) {
  const rawId = useId().replace(/:/g, "");
  const body = MAKE_COLORS[make] ?? "#22c55e";
  const sky = `${rawId}-sky`;
  const floor = `${rawId}-floor`;

  return (
    <svg viewBox="0 0 640 360" className="h-full w-full" role="img" aria-label={`${make} image ${frame + 1}`}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2820" />
          <stop offset="1" stopColor="#070807" />
        </linearGradient>
        <linearGradient id={floor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#243028" />
          <stop offset="1" stopColor="#101510" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${sky})`} />
      <ellipse cx="320" cy="300" rx="250" ry="28" fill="#000" opacity="0.35" />
      {frame === 2 ? (
        <g>
          <rect x="70" y="210" width="500" height="70" fill={`url(#${floor})`} />
          <circle cx="320" cy="168" r="78" fill="#0b0f0c" stroke="#22c55e" strokeWidth="8" />
          <circle cx="320" cy="168" r="46" fill="#121512" stroke="#f3f7f4" strokeWidth="4" />
          <path d="M320 132v46l28-16" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          <rect x="430" y="150" width="70" height="28" rx="6" fill="#f3f7f4" />
          <path d="M448 164h18M454 158v12" stroke="#052e16" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : frame === 1 ? (
        <g>
          <rect x="40" y="230" width="560" height="50" fill={`url(#${floor})`} />
          <path d="M70 240h150l40-58h170l70 40h80v58H70z" fill={body} />
          <path d="M250 188h150l40 28H230z" fill="#b7e4ff" opacity="0.9" />
          <circle cx="190" cy="242" r="34" fill="#0b0d0c" />
          <circle cx="190" cy="242" r="14" fill="#d6d3d1" />
          <circle cx="470" cy="242" r="34" fill="#0b0d0c" />
          <circle cx="470" cy="242" r="14" fill="#d6d3d1" />
          <rect x="520" y="200" width="28" height="10" rx="2" fill="#f6e05e" />
        </g>
      ) : (
        <g>
          <rect x="50" y="250" width="540" height="46" fill={`url(#${floor})`} />
          <path d="M120 250 190 168h250l80 82H120z" fill={body} />
          <path d="M210 176h200l40 48H176z" fill="#d7f1ff" opacity="0.92" />
          <circle cx="210" cy="250" r="36" fill="#0b0d0c" />
          <circle cx="210" cy="250" r="15" fill="#d6d3d1" />
          <circle cx="450" cy="250" r="36" fill="#0b0d0c" />
          <circle cx="450" cy="250" r="15" fill="#d6d3d1" />
          <rect x="292" y="214" width="56" height="18" rx="4" fill="#052e16" />
        </g>
      )}
    </svg>
  );
}

function buildFrames(photos: string[]): Visual[] {
  const frames: Visual[] = photos.slice(0, 3).map((src) => ({ kind: "photo", src }));
  let art = 0;
  while (frames.length < 3) {
    frames.push({ kind: "art", frame: art });
    art += 1;
  }
  return frames;
}

export function FrameCycle({
  make,
  photos,
  onOpen,
}: {
  make: string;
  photos: string[];
  onOpen: () => void;
}) {
  const visuals = buildFrames(photos);
  const [index, setIndex] = useState(0);
  const showingMore = index >= visuals.length;
  const visual = visuals[index];
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  function next() {
    setIndex((current) => (current >= visuals.length ? current : current + 1));
  }

  function prev() {
    setIndex((current) => (current <= 0 ? 0 : current - 1));
  }

  return (
    <button
      type="button"
      className="relative block aspect-video w-full touch-pan-y overflow-hidden bg-bg"
      onPointerDown={(event) => {
        startX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (startX.current == null) return;
        const delta = event.clientX - startX.current;
        startX.current = null;
        if (delta <= -30) {
          swiped.current = true;
          event.stopPropagation();
          if (showingMore) onOpen();
          else next();
          return;
        }
        if (delta >= 30) {
          swiped.current = true;
          event.stopPropagation();
          prev();
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        if (showingMore) {
          onOpen();
          return;
        }
        next();
      }}
    >
      {showingMore || !visual ? (
        <span className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-fg">
          View more images
        </span>
      ) : visual.kind === "photo" ? (
        <img src={visual.src} alt="" className="h-full w-full object-cover" />
      ) : (
        <CarArt make={make} frame={visual.frame} />
      )}
    </button>
  );
}
