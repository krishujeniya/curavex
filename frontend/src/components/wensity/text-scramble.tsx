"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextScrambleTrigger = "mount" | "view" | "hover";

export type TextScrambleCharset =
  | "alphanumeric"
  | "letters"
  | "uppercase"
  | "lowercase"
  | "numbers"
  | "binary"
  | "hex"
  | "symbols";

export type TextScrambleReveal = "start" | "end" | "center" | "random";

export interface TextScrambleHandle {
  /** Scramble the text again and decode it, from wherever it is now. */
  play: () => void;
}

export interface TextScrambleProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The text to show. Changing it decodes into the new text. */
  text: string;
  /** Tag rendered as the outer element. Default: `"span"`. */
  as?: keyof React.JSX.IntrinsicElements;
  /**
   * When to decode. `"mount"` runs on load, `"view"` when it scrolls into
   * view, `"hover"` on pointer enter and keyboard focus. Pass an array to
   * combine them. Default: `"view"`.
   */
  trigger?: TextScrambleTrigger | TextScrambleTrigger[];
  /** A preset, or any string of your own characters. Default: `"alphanumeric"`. */
  characters?: TextScrambleCharset | (string & {});
  /** Seconds until the last character locks in. Default: 0.9 */
  duration?: number;
  /** Milliseconds between random glyph swaps. Lower flickers faster. Default: 50 */
  speed?: number;
  /** Seconds before the first load or in-view run. Default: 0 */
  delay?: number;
  /** Which characters lock in first. Default: `"start"`. */
  reveal?: TextScrambleReveal;
  /** Random letters follow the case of the letter they stand in for. Default: true */
  matchCase?: boolean;
  /** Characters that never scramble. Spaces never do. */
  keep?: string;
  /** With `trigger="view"`, decode only the first time. Default: true */
  once?: boolean;
  /** Colour of characters still scrambling. Default: the text colour. */
  scrambleColor?: string;
  /** Opacity of characters still scrambling, 0 to 1. Default: 0.45 */
  scrambleOpacity?: number;
  /** Called each time a run finishes. */
  onComplete?: () => void;
  /** Imperative handle with `play()`, for replays from your own controls. */
  controlRef?: React.Ref<TextScrambleHandle>;
  className?: string;
}

const CHARSETS: Record<TextScrambleCharset, string> = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  binary: "01",
  hex: "0123456789ABCDEF",
  symbols: "!<>_\\/[]{}=+*^?#%&$@~",
};

const DEFAULT_KEEP = ".,:;!?'\"()-/&’";

/** Hover and focus listen on the nearest interactive parent, so a link works. */
const INTERACTIVE = "a,button,summary,label,[role='button'],[role='link'],[role='menuitem'],[tabindex]:not([tabindex='-1'])";

const CELL_CLASS =
  "inline-grid before:invisible before:content-[attr(data-c)] before:[grid-area:1/1] after:content-[attr(data-g)] after:[grid-area:1/1] after:justify-self-center after:transition-opacity after:duration-150 after:ease-out data-[s]:after:text-[color:var(--ts-c,currentColor)] data-[s]:after:opacity-[var(--ts-o,0.45)]";

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function resolvePool(characters: string): string[] {
  const source = characters in CHARSETS ? CHARSETS[characters as TextScrambleCharset] : characters;
  const pool = Array.from(new Set(Array.from(source).filter((ch) => ch.trim() !== "")));
  return pool.length ? pool : Array.from(CHARSETS.alphanumeric);
}

function isLetter(ch: string) {
  return ch.toLowerCase() !== ch.toUpperCase();
}

function applyCase(glyph: string, source: string, matchCase: boolean) {
  if (!matchCase || !isLetter(source) || !isLetter(glyph)) return glyph;
  return source === source.toUpperCase() ? glyph.toUpperCase() : glyph.toLowerCase();
}

function pickGlyph(list: string[], previous: string) {
  let index = Math.floor(Math.random() * list.length);
  if (list.length > 1 && list[index] === previous) index = (index + 1) % list.length;
  return list[index];
}

let measureCanvas: CanvasRenderingContext2D | null | undefined;

function measureContext() {
  if (measureCanvas === undefined) {
    measureCanvas =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  }
  return measureCanvas;
}

type Fitter = (source: string) => string[];

/**
 * Random glyphs for each slot, no wider than 1.25x the letter they stand in
 * for, so a W never spills over the letters beside an i. Too few fit: the
 * narrowest third of the pool.
 */
function createFitter(font: string, pool: string[], matchCase: boolean): Fitter {
  const ctx = measureContext();
  const widths = new Map<string, number>();
  const width = (glyph: string) => {
    let w = widths.get(glyph);
    if (w === undefined && ctx) {
      ctx.font = font;
      w = ctx.measureText(glyph).width;
      widths.set(glyph, w);
    }
    return w ?? 0;
  };
  const lists = new Map<string, string[]>();
  return (source) => {
    const cached = lists.get(source);
    if (cached) return cached;
    const cased = Array.from(new Set(pool.map((glyph) => applyCase(glyph, source, matchCase))));
    let list = cased;
    if (ctx && cased.length > 1) {
      const limit = width(source) * 1.25;
      const fit = cased.filter((glyph) => width(glyph) <= limit);
      list =
        fit.length >= 2
          ? fit
          : [...cased]
              .sort((a, b) => width(a) - width(b))
              .slice(0, Math.max(2, Math.ceil(cased.length / 3)));
    }
    lists.set(source, list);
    return list;
  };
}

function fontOf(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

/** Rank 0 locks first. */
function revealRanks(count: number, reveal: TextScrambleReveal): number[] {
  const ranks = Array.from({ length: count }, (_, i) => i);
  if (reveal === "end") return ranks.map((i) => count - 1 - i);
  if (reveal === "center") return ranks.map((i) => Math.abs(i - (count - 1) / 2));
  if (reveal === "random") {
    for (let i = count - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
    }
  }
  return ranks;
}

/**
 * TextScramble
 *
 * Decodes text out of random characters, one glyph at a time. Each glyph
 * sits in a cell sized by its final character, so nothing shifts while the
 * random glyphs flicker, even in a proportional font.
 *
 * - Glyphs are drawn from data attributes on every frame: no React render
 *   per tick, and the real text exists once in the DOM (screen-reader copy).
 * - Server HTML shows the final text. Load and in-view runs scramble it
 *   before first paint, so there is no flash of the real words.
 * - `prefers-reduced-motion` shows the text as is and skips every run.
 */
export function TextScramble({
  text,
  as = "span",
  trigger = "view",
  characters = "alphanumeric",
  duration = 0.9,
  speed = 50,
  delay = 0,
  reveal = "start",
  matchCase = true,
  keep = DEFAULT_KEEP,
  once = true,
  scrambleColor,
  scrambleOpacity,
  onComplete,
  controlRef,
  className,
  style,
  ...rest
}: TextScrambleProps) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const frameRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reducedRef = React.useRef(false);
  const playedRef = React.useRef(false);
  const runningRef = React.useRef(false);
  const fitterRef = React.useRef<{ key: string; fit: Fitter } | null>(null);

  const pool = React.useMemo(() => resolvePool(characters), [characters]);
  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  const triggerKey = [...triggers].sort().join(",");
  const entrance = triggers.includes("mount") || triggers.includes("view");

  const optionsRef = React.useRef({ pool, duration, speed, reveal, matchCase, keep, onComplete });
  optionsRef.current = { pool, duration, speed, reveal, matchCase, keep, onComplete };

  const cells = React.useCallback(
    () => Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-c]") ?? []),
    [],
  );

  const fitter = React.useCallback((): Fitter => {
    const root = rootRef.current;
    const { pool: glyphs, matchCase: match } = optionsRef.current;
    const font = root ? fontOf(root) : "";
    const key = `${font}|${match}|${glyphs.join("")}`;
    if (fitterRef.current?.key !== key) {
      fitterRef.current = { key, fit: createFitter(font, glyphs, match) };
    }
    return fitterRef.current.fit;
  }, []);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    clearTimeout(timerRef.current);
    frameRef.current = 0;
    runningRef.current = false;
  }, []);

  const settle = React.useCallback(() => {
    stop();
    for (const cell of cells()) {
      cell.dataset.g = cell.dataset.c;
      delete cell.dataset.s;
    }
  }, [cells, stop]);

  const scramble = React.useCallback(() => {
    if (reducedRef.current) return;
    const { keep: kept } = optionsRef.current;
    const fit = fitter();
    for (const cell of cells()) {
      const source = cell.dataset.c ?? "";
      if (kept.includes(source)) continue;
      cell.dataset.g = pickGlyph(fit(source), cell.dataset.g ?? "");
      cell.dataset.s = "";
    }
  }, [cells, fitter]);

  const play = React.useCallback(
    (delayMs = 0) => {
      stop();
      if (reducedRef.current) {
        settle();
        return;
      }
      playedRef.current = true;
      runningRef.current = true;

      const opts = optionsRef.current;
      const active = cells().filter((cell) => !opts.keep.includes(cell.dataset.c ?? ""));
      if (active.length === 0) {
        opts.onComplete?.();
        return;
      }
      scramble();
      const fit = fitter();

      const total = Math.max(0.1, opts.duration) * 1000;
      const lead = Math.min(total * 0.3, 320);
      const ranks = revealRanks(active.length, opts.reveal);
      const maxRank = Math.max(...ranks) || 1;
      const lockAt = ranks.map((rank) =>
        active.length === 1 ? total : lead + (rank / maxRank) * (total - lead),
      );
      const swapEvery = Math.max(16, opts.speed);
      const lastSwap = new Float64Array(active.length);
      const done = new Uint8Array(active.length);
      let left = active.length;
      let start = -1;

      const tick = (now: number) => {
        if (start < 0) start = now;
        const elapsed = now - start;
        for (let k = 0; k < active.length; k += 1) {
          if (done[k]) continue;
          const cell = active[k];
          if (elapsed >= lockAt[k]) {
            cell.dataset.g = cell.dataset.c;
            delete cell.dataset.s;
            done[k] = 1;
            left -= 1;
          } else if (now - lastSwap[k] >= swapEvery) {
            cell.dataset.g = pickGlyph(fit(cell.dataset.c ?? ""), cell.dataset.g ?? "");
            lastSwap[k] = now;
          }
        }
        if (left > 0) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          frameRef.current = 0;
          runningRef.current = false;
          optionsRef.current.onComplete?.();
        }
      };

      const begin = () => {
        frameRef.current = requestAnimationFrame(tick);
      };
      if (delayMs > 0) timerRef.current = setTimeout(begin, delayMs);
      else begin();
    },
    [cells, fitter, scramble, settle, stop],
  );

  React.useImperativeHandle(controlRef, () => ({ play: () => play(0) }), [play]);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const active = new Set(triggerKey.split(","));
    const cleanups: Array<() => void> = [];

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = motion.matches;
    const onMotion = () => {
      reducedRef.current = motion.matches;
      if (motion.matches) settle();
    };
    motion.addEventListener("change", onMotion);
    cleanups.push(() => motion.removeEventListener("change", onMotion));

    const wantsEntrance = active.has("mount") || active.has("view");
    if (wantsEntrance && !playedRef.current) scramble();

    if (active.has("mount")) {
      play(delay * 1000);
    } else if (active.has("view")) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              play(playedRef.current ? 0 : delay * 1000);
              if (once) io.disconnect();
            } else if (!once && playedRef.current) {
              stop();
              scramble();
            }
          }
        },
        { threshold: 0.35 },
      );
      io.observe(root);
      cleanups.push(() => io.disconnect());
    }

    if (active.has("hover")) {
      const target = (root.closest(INTERACTIVE) as HTMLElement | null) ?? root;
      const onEnter = (event: PointerEvent) => {
        // A hover never restarts a run in progress, so pointer jitter
        // over the text cannot keep it scrambled.
        if (event.pointerType !== "touch" && !runningRef.current) play();
      };
      const onFocus = (event: FocusEvent) => {
        const el = event.target as Element | null;
        if (el?.matches?.(":focus-visible")) play();
      };
      target.addEventListener("pointerenter", onEnter);
      target.addEventListener("focusin", onFocus);
      cleanups.push(() => {
        target.removeEventListener("pointerenter", onEnter);
        target.removeEventListener("focusin", onFocus);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      stop();
    };
  }, [triggerKey, once, delay, play, scramble, settle, stop]);

  // A new text decodes into place. Before the first entrance run it just
  // waits, scrambled, for that run.
  const firstTextRef = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (firstTextRef.current) {
      firstTextRef.current = false;
      return;
    }
    if (entrance && !playedRef.current) scramble();
    else play();
    // Only a new text should start this run, not a new callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const tokens = React.useMemo(() => text.split(/(\s+)/).filter(Boolean), [text]);

  const vars: Record<string, string | number> = {};
  if (scrambleColor) vars["--ts-c"] = scrambleColor;
  if (scrambleOpacity !== undefined) vars["--ts-o"] = Math.min(1, Math.max(0, scrambleOpacity));

  const Tag = as as unknown as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { ref?: React.RefCallback<HTMLElement | null> }
  >;

  return (
    <Tag
      {...rest}
      ref={(node) => {
        rootRef.current = node;
      }}
      className={cn("relative", className)}
      style={{ ...vars, ...style } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, i) =>
          /^\s+$/.test(token) ? (
            " "
          ) : (
            <span
              key={i}
              className={token.length > 20 ? undefined : "inline-block whitespace-nowrap"}
            >
              {Array.from(token).map((ch, j) => (
                <span key={j} data-c={ch} data-g={ch} className={CELL_CLASS} />
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
