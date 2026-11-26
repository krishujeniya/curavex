"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Animated Hamburger Menu
 *
 * An animated hamburger menu button with eight ways to turn into its open
 * state. Every variant is plain CSS transitions on transforms, widths and
 * SVG dashes, so there is no animation library and nothing runs per frame.
 *
 * The bars are drawn in a 24 unit box and scaled to `size`, so a thicker
 * stroke or a bigger icon keeps the same proportions. Each bar is two nested
 * spans: the outer one moves, the inner one turns or grows. That split is
 * what lets the two stage variants meet in the middle first and rotate
 * second, then play the same steps backwards on close.
 *
 * Hovering a closed icon gives a small hint of what a click will do: bars
 * draw together, even out, part or lean. The hint waits until a toggle has
 * finished, so leaving mid animation never rushes the close.
 *
 * Every curve is timed, never a spring, so nothing overshoots its resting
 * place. With reduced motion the icon switches state without animating.
 *
 * The button reports its state with `aria-expanded`. Point `aria-controls`
 * at the menu it opens.
 */

export type HamburgerMenuVariant =
  | "squeeze"
  | "pivot"
  | "arrow"
  | "stagger"
  | "duo"
  | "split"
  | "wipe"
  | "loop";

export interface HamburgerMenuProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** How the bars move into the open state. */
  variant?: HamburgerMenuVariant;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the next state on every toggle. */
  onOpenChange?: (open: boolean) => void;
  /** Icon size in pixels. The button adds 16px of hit area around it. */
  size?: number;
  /** Bar thickness in units of the 24 unit icon box. */
  thickness?: number;
  /** Length of one full open or close in milliseconds. */
  duration?: number;
  /** Round bar ends. Off gives square ends. */
  rounded?: boolean;
}

// Geometry, in units of the 24 unit icon box.
const LENGTH = 16;
const GAP = 5.5;

const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const HOVER_MS = 240;

type BarLayer = {
  transform?: string;
  transition?: string;
  width?: number;
  opacity?: number;
  origin?: string;
};

type Bar = { outer: BarLayer; inner: BarLayer };

type BarContext = {
  open: boolean;
  /** Closed and hovered: show the hint pose. */
  hint: boolean;
  /** Duration in ms. */
  d: number;
  /** Units to px. */
  u: (value: number) => number;
  t: number;
};

const tr = (props: string, ms: number, ease = IN_OUT, delay = 0) =>
  props
    .split(" ")
    .map((prop) => `${prop} ${Math.round(ms)}ms ${ease} ${Math.round(Math.max(0, delay))}ms`)
    .join(", ");

const move = (x: number, y: number, u: BarContext["u"]) => `translate3d(${u(x)}px, ${u(y)}px, 0)`;

/**
 * Two stage timing. The second stage starts before the first one ends, so
 * the bars never stop dead in the middle. Returns [duration, first delay,
 * second delay] for the current direction.
 */
function stages(open: boolean, d: number) {
  const run = d * 0.58;
  const lag = d - run;
  return { run, move: open ? 0 : lag, turn: open ? lag : 0 };
}

/** Two stage close mark: the bars meet in the middle, then rotate. */
function squeeze({ open, hint, d, u }: BarContext): Bar[] {
  const s = stages(open, d);
  const gap = hint ? GAP - 1.25 : GAP;
  const side = (dir: 1 | -1): Bar => ({
    outer: { transform: move(0, open ? 0 : dir * gap, u), transition: tr("transform", s.run, IN_OUT, s.move) },
    inner: { transform: `rotate(${open ? dir * -45 : 0}deg)`, transition: tr("transform", s.run, IN_OUT, s.turn) },
  });
  return [
    side(-1),
    {
      outer: {},
      inner: {
        opacity: open ? 0 : 1,
        transition: `opacity ${Math.round(d * 0.12)}ms linear ${Math.round(open ? s.run * 0.8 : s.run * 0.75)}ms`,
      },
    },
    side(1),
  ];
}

/** Bars swing on their left ends into a cross; the middle bar slides away. */
function pivot({ open, hint, d, u, t }: BarContext): Bar[] {
  // The bars turn about their left cap. Pick the pivot height so they cross
  // at their midpoints, then shift the whole cross back to the center.
  const reach = (LENGTH - t) / 2;
  const lift = reach * Math.SQRT1_2;
  const shift = LENGTH / 2 - t / 2 - lift;
  const origin = `${u(t / 2)}px 50%`;
  const side = (dir: 1 | -1): Bar => ({
    outer: { transform: move(open ? shift : 0, dir * (open ? lift : GAP), u), transition: tr("transform", d) },
    inner: {
      transform: `rotate(${open ? dir * -45 : hint ? dir * -6 : 0}deg)`,
      transition: tr("transform", d),
      origin,
    },
  });
  return [
    side(-1),
    {
      outer: { transform: move(open ? LENGTH * 0.6 : 0, 0, u), transition: tr("transform", d * 0.7, OUT) },
      inner: {
        width: open ? LENGTH : hint ? LENGTH * 0.7 : LENGTH,
        opacity: open ? 0 : 1,
        transition: `${tr("width", d * 0.7, OUT)}, ${tr("opacity", d * 0.45, IN_OUT, open ? 0 : d * 0.25)}`,
      },
    },
    side(1),
  ];
}

/** Top and bottom bars fold into the head of a back arrow. */
function arrow({ open, hint, d, u, t }: BarContext): Bar[] {
  const head = LENGTH * 0.56;
  const origin = `${u(t / 2)}px 50%`;
  const side = (dir: 1 | -1): Bar => ({
    outer: { transform: move(0, open ? 0 : dir * (hint ? GAP - 0.75 : GAP), u), transition: tr("transform", d) },
    inner: {
      transform: `rotate(${open ? dir * 45 : 0}deg)`,
      width: open ? head : hint ? LENGTH * 0.78 : LENGTH,
      transition: tr("transform width", d),
      origin,
    },
  });
  return [side(-1), { outer: {}, inner: {} }, side(1)];
}

/** Three bars of falling length grow out and cross, one after the other. */
function stagger({ open, hint, d, u }: BarContext): Bar[] {
  const run = d * 0.82;
  const lag = d - run;
  const side = (dir: 1 | -1, rest: number, delay: number): Bar => ({
    outer: { transform: move(0, open ? 0 : dir * GAP, u), transition: tr("transform", run, IN_OUT, delay) },
    inner: {
      transform: `rotate(${open ? dir * -45 : 0}deg)`,
      width: open ? LENGTH : rest,
      transition: tr("transform width", run, IN_OUT, delay),
    },
  });
  return [
    side(-1, LENGTH, open ? 0 : lag),
    {
      outer: {},
      inner: {
        width: open ? 0 : LENGTH * (hint ? 0.86 : 0.66),
        opacity: open ? 0 : 1,
        transition: `${tr("width", run * 0.6, IN_OUT, open ? 0 : lag)}, ${tr("opacity", run * 0.3, IN_OUT, open ? run * 0.3 : lag)}`,
      },
    },
    side(1, LENGTH * (hint ? 0.72 : 0.4), open ? lag : 0),
  ];
}

/** Two bars, the lower one shorter: they meet, even out, then cross. */
function duo({ open, hint, d, u }: BarContext): Bar[] {
  const s = stages(open, d);
  const gap = 3.75;
  const short = LENGTH * (hint ? 1 : 0.6);
  const top: Bar = {
    outer: { transform: move(0, open ? 0 : -gap, u), transition: tr("transform", s.run, IN_OUT, s.move) },
    inner: { transform: `rotate(${open ? 45 : 0}deg)`, transition: tr("transform", s.run, IN_OUT, s.turn) },
  };
  // The short bar keeps its right end still while it grows: translate and
  // width share one curve, so the edge stays put on every frame.
  const bottom: Bar = {
    outer: {
      transform: move(open ? 0 : LENGTH - short, open ? 0 : gap, u),
      width: open ? LENGTH : short,
      transition: tr("transform width", s.run, IN_OUT, s.move),
    },
    inner: { transform: `rotate(${open ? -45 : 0}deg)`, transition: tr("transform", s.run, IN_OUT, s.turn) },
  };
  return [top, bottom];
}

/** Each bar breaks at its middle and the four halves fold into a cross. */
function split({ open, hint, d, u, t }: BarContext): Bar[] {
  const width = LENGTH / 2 + t / 2;
  const restX = LENGTH / 2 - width / 2;
  const part = hint ? 1.1 : 0;
  const arm = ((width - t) / 2) * Math.SQRT1_2;
  const run = d * 0.86;
  const lag = d - run;
  // A half sits left aligned in the full bar box, so its own center starts
  // at -restX; every translate adds restX back to place it from the middle.
  const half = (sx: 1 | -1, sy: 1 | -1, delay: number): Bar => ({
    outer: {
      transform: move(sx * (open ? arm : restX + part) + restX, sy * (open ? arm : GAP), u),
      width,
      transition: tr("transform", run, IN_OUT, delay),
    },
    inner: { transform: `rotate(${open ? sx * sy * 45 : 0}deg)`, transition: tr("transform", run, IN_OUT, delay) },
  });
  const topDelay = open ? 0 : lag;
  const bottomDelay = open ? lag : 0;
  return [
    half(-1, -1, topDelay),
    half(1, -1, topDelay),
    {
      outer: {},
      inner: {
        transform: `scaleX(${open ? 0 : 1})`,
        opacity: open ? 0 : 1,
        transition: tr("transform opacity", run * 0.55, IN_OUT, open ? 0 : run * 0.4),
      },
    },
    half(-1, 1, bottomDelay),
    half(1, 1, bottomDelay),
  ];
}

/** The bars slide out in a cascade, then the cross draws in stroke by stroke. */
function wipe({ open, hint, d, u }: BarContext): Bar[] {
  const out = d * 0.42;
  const step = d * 0.07;
  const draw = d * 0.38;
  const bar = (i: number): Bar => {
    // Opening leaves top first; closing returns bottom first, after the
    // cross has cleared.
    const delay = open ? i * step : d - out - (2 - i) * step;
    const lean = hint ? 1.5 + i * 0.6 : 0;
    return {
      outer: {
        transform: move(open ? LENGTH * 0.75 : lean, (i - 1) * GAP, u),
        transition: tr("transform", out, open ? "cubic-bezier(0.5, 0, 0.75, 0)" : OUT, delay),
      },
      inner: {
        opacity: open ? 0 : 1,
        transition: tr("opacity", out * 0.7, IN_OUT, open ? delay + out * 0.3 : delay),
      },
    };
  };
  const stroke = (dir: 1 | -1, i: number): Bar => {
    const delay = open ? d - draw - (1 - i) * step * 1.5 : i * step * 1.5;
    return {
      outer: { transform: `rotate(${dir * 45}deg)` },
      inner: {
        width: open ? LENGTH : 0,
        transition: tr("width", draw, open ? OUT : "cubic-bezier(0.5, 0, 0.75, 0)", open ? delay : (1 - i) * step * 1.5),
      },
    };
  };
  return [bar(0), bar(1), bar(2), stroke(1, 0), stroke(-1, 1)];
}

const VARIANTS: Record<Exclude<HamburgerMenuVariant, "loop">, (ctx: BarContext) => Bar[]> = {
  squeeze,
  pivot,
  arrow,
  stagger,
  duo,
  split,
  wipe,
};

// Loop: SVG paths whose visible dash travels from the bar, around a curve,
// onto a diagonal of the cross. Drawn with cap centers at 5 and 19 so the
// bars match the span variants.
const LOOP_TOP = { y: 12 - GAP, c1: [24, 12 - GAP], c2: [22, 22], end: [17, 17], to: [7, 7] } as const;
const LOOP_BOTTOM = { y: 12 + GAP, c1: [24, 12 + GAP], c2: [22, 2], end: [17, 7], to: [7, 17] } as const;
const LOOP_BAR = 14;
const LOOP_DIAGONAL = Math.hypot(10, 10);

function bezierLength(p0: readonly number[], p1: readonly number[], p2: readonly number[], p3: readonly number[]) {
  let total = 0;
  let px = p0[0];
  let py = p0[1];
  for (let i = 1; i <= 64; i++) {
    const s = i / 64;
    const m = 1 - s;
    const x = m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0];
    const y = m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1];
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

const LOOP_CURVE = bezierLength([19, LOOP_TOP.y], LOOP_TOP.c1, LOOP_TOP.c2, LOOP_TOP.end);
const LOOP_TOTAL = LOOP_BAR + LOOP_CURVE + LOOP_DIAGONAL;

const loopPath = (p: typeof LOOP_TOP | typeof LOOP_BOTTOM) =>
  `M5 ${p.y} H19 C ${p.c1.join(" ")}, ${p.c2.join(" ")}, ${p.end.join(" ")} L ${p.to.join(" ")}`;

function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Only the keys a layer sets, so an unset width never wipes a base width. */
function layerStyle(layer: BarLayer, u: BarContext["u"], transition: string | undefined): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (layer.transform !== undefined) style.transform = layer.transform;
  if (layer.width !== undefined) style.width = u(layer.width);
  if (layer.opacity !== undefined) style.opacity = layer.opacity;
  if (layer.origin !== undefined) style.transformOrigin = layer.origin;
  if (transition !== undefined) style.transition = transition;
  return style;
}

const HOVER_TRANSITION = tr("transform width opacity", HOVER_MS, OUT);

export function HamburgerMenu({
  variant = "squeeze",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  size = 24,
  thickness = 2,
  duration = 420,
  rounded = true,
  className,
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  type = "button",
  "aria-label": ariaLabel = "Menu",
  ...props
}: HamburgerMenuProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const still = useReducedMotion();

  const [hovered, setHovered] = React.useState(false);

  const k = size / 24;
  const u = (value: number) => Math.round(value * k * 1000) / 1000;
  const t = thickness;
  const d = Math.max(0, duration);

  // True while an open or close plays. The hover hint waits for it, and
  // hover changes use their own short timing only once it has settled. It
  // has to flip on the same render as `open`, or the toggle itself would
  // pick up the hover timing, so the change is noted during render.
  const [settle, setSettle] = React.useState({ open, active: false });
  if (settle.open !== open) setSettle({ open, active: true });
  const settling = settle.open !== open || settle.active;

  React.useEffect(() => {
    if (!settle.active) return;
    const id = window.setTimeout(() => setSettle((s) => ({ ...s, active: false })), d * 1.25 + 40);
    return () => window.clearTimeout(id);
  }, [settle, d]);

  const hint = hovered && !open && !settling;
  const hoverMode = !settling;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !open;
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const transitionFor = (layer: BarLayer) => {
    if (still) return "none";
    if (hoverMode) return layer.transition === undefined ? undefined : HOVER_TRANSITION;
    return layer.transition;
  };

  let glyph: React.ReactNode;

  if (variant === "loop") {
    const run = d * 1.2;
    const dashTransition = still
      ? "none"
      : hoverMode
        ? tr("stroke-dasharray stroke-dashoffset", HOVER_MS, OUT)
        : tr("stroke-dasharray stroke-dashoffset", run);
    const reach = hint ? LOOP_BAR + 2.5 : LOOP_BAR;
    const travel = (path: string, key: string) => (
      <path
        key={key}
        d={path}
        style={{
          strokeDasharray: `${open ? LOOP_DIAGONAL : reach} ${LOOP_TOTAL}`,
          strokeDashoffset: open ? -(LOOP_BAR + LOOP_CURVE) : 0,
          transition: dashTransition,
        }}
      />
    );
    glyph = (
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={t}
        strokeLinecap={rounded ? "round" : "butt"}
        className="overflow-visible"
      >
        {travel(loopPath(LOOP_TOP), "top")}
        <path
          d="M5 12 H19"
          style={{
            strokeDasharray: `${LOOP_BAR} ${LOOP_BAR * 3}`,
            strokeDashoffset: open ? -LOOP_BAR : hint ? -2.5 : 0,
            opacity: open ? 0 : 1,
            transition: still
              ? "none"
              : hoverMode
                ? tr("stroke-dashoffset opacity", HOVER_MS, OUT)
                : `${tr("stroke-dashoffset", run * 0.5, IN_OUT, open ? 0 : run * 0.5)}, ${tr("opacity", run * 0.2, IN_OUT, open ? run * 0.3 : run * 0.5)}`,
          }}
        />
        {travel(loopPath(LOOP_BOTTOM), "bottom")}
      </svg>
    );
  } else {
    const bars = VARIANTS[variant]({ open, hint, d, u, t });
    const radius = rounded ? 9999 : 0;
    glyph = (
      <span aria-hidden className="relative block" style={{ width: size, height: size }}>
        {bars.map((bar, i) => (
          <span
            key={`${variant}-${i}`}
            className="absolute left-1/2 top-1/2 block"
            style={{
              width: u(LENGTH),
              height: u(t),
              marginLeft: -u(LENGTH) / 2,
              marginTop: -u(t) / 2,
              ...layerStyle(bar.outer, u, transitionFor(bar.outer)),
            }}
          >
            <span
              className="block h-full w-full bg-current"
              style={{ borderRadius: radius, ...layerStyle(bar.inner, u, transitionFor(bar.inner)) }}
            />
          </span>
        ))}
      </span>
    );
  }

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-expanded={open}
      onClick={handleClick}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setHovered(false);
      }}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-[10px] text-current outline-none transition-colors duration-150 [-webkit-tap-highlight-color:transparent]",
        "hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:hover:bg-white/[0.07]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{ width: size + 16, height: size + 16, ...style }}
      {...props}
    >
      {glyph}
    </button>
  );
}
