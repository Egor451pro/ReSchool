"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  savingLabel?: string;
  className?: string;
};

/** Сравнение «до / после» с перетаскиваемым разделителем и плашкой экономии. */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "До ремонта",
  afterAlt = "После ремонта",
  savingLabel,
  className = "",
}: BeforeAfterSliderProps) {
  const labelId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(52);
  const [frameW, setFrameW] = useState(0);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const sync = () => setFrameW(el.offsetWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setFromClientX = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, next)));
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setFromClientX(event.clientX);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-placeholder shadow-[var(--shadow-soft)] ring-1 ring-line ${className}`}
    >
      <div
        ref={frameRef}
        role="group"
        aria-labelledby={labelId}
        className="relative aspect-[4/3] w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span id={labelId} className="sr-only">
          Сравнение фото до и после ремонта. Перетащите разделитель.
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt={afterAlt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pos}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeSrc}
            alt={beforeAlt}
            draggable={false}
            className="absolute inset-0 h-full max-w-none object-cover"
            style={{ width: frameW > 0 ? `${frameW}px` : "100%" }}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-cream"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-mint text-on-mint shadow-[0_6px_18px_rgba(0,59,70,0.28)] ring-2 ring-cream">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M8 6L3 12l5 6M16 6l5 6-5 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-deep/80 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-cream uppercase">
          До
        </span>
        <span className="pointer-events-none absolute top-3 right-3 z-20 rounded-full bg-mint/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-on-mint uppercase">
          После
        </span>

        {savingLabel ? (
          <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-mint px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-on-mint shadow-[0_10px_28px_rgba(0,59,70,0.28)] ring-1 ring-cream/40">
            {savingLabel}
          </span>
        ) : null}

        <input
          type="range"
          min={4}
          max={96}
          value={Math.round(pos)}
          aria-label="Положение сравнения до и после"
          className="absolute inset-x-3 bottom-3 z-30 h-2 cursor-ew-resize opacity-0"
          onChange={(event) => setPos(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
