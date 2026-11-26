"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Copy Button
 *
 * A copy to clipboard button whose icon morphs into a check. On a
 * successful copy the back sheet tucks into the front one, the front sheet
 * folds away and a check draws itself in its place, while the button turns
 * into a solid green button that spreads out from the exact point that was
 * pressed. After `timeout` the check undraws and the sheets come back.
 *
 * The surface is built like a physical part: a vertical gradient body, a lit
 * top edge and a darker ring drawn with inset shadows, and a soft shadow
 * under it. The success colour is a full material layer of its own, revealed
 * by a growing clip circle, so its gradient and lit edge stay exact while it
 * spreads. Hover dims the face toward the bottom, press sinks it.
 *
 * A failed copy (blocked clipboard, a `value` function that throws) turns
 * red and draws a cross with a short shake, so a broken copy never pretends
 * to work.
 *
 * Everything is CSS driven by `data-state`, so nothing runs per frame and a
 * second press mid animation simply retargets. The label variant stacks its
 * words in one grid cell, so the width never changes as "Copy" becomes
 * "Copied". Screen readers hear the result through a polite live region.
 * With reduced motion the icons swap with a short fade and the colour
 * appears without spreading.
 */

export type CopyButtonVariant = "icon" | "label";
export type CopyButtonAppearance = "solid" | "ghost";
export type CopyButtonSize = "sm" | "md" | "lg";
export type CopyButtonTone = "green" | "blue" | "violet" | "amber" | "mono";
export type CopyButtonState = "idle" | "copied" | "error";

export interface CopyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onCopy" | "onError" | "children"> {
  /** Text to copy, or a function that returns it (sync or async). */
  value: string | (() => string | Promise<string>);
  /** Icon only, or icon with a label that rolls to "Copied" once copied. */
  variant?: CopyButtonVariant;
  /** Solid is a raised button that fills with the tone. Ghost is bare and only its icon and label take the tone. */
  appearance?: CopyButtonAppearance;
  size?: CopyButtonSize;
  /** Colour the button turns once the copy lands. */
  tone?: CopyButtonTone;
  /** How long the check stays, in milliseconds. */
  timeout?: number;
  /** Spread the success colour from the point that was pressed. */
  sweep?: boolean;
  /** Words for the label variant, the aria-label and the live region. */
  labels?: { copy?: string; copied?: string; failed?: string };
  /** Called with the copied text. */
  onCopied?: (text: string) => void;
  /** Called when the copy fails. */
  onCopyError?: (error: unknown) => void;
  /** Called every time the visible state changes. */
  onStateChange?: (state: CopyButtonState) => void;
}

/** Each role is [light, dark]. */
type ToneMaterial = {
  /** Body gradient of the filled button. */
  body: [string, string];
  /** Lit top edge and ring of the filled button. */
  edge: [string, string];
  /** Icon and label on the filled button. */
  ink: [string, string];
  /** Icon and label colour for the ghost appearance. */
  on: [string, string];
};

const lit = "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.1)";
const litDark = "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.06)";
const grad = (a: string, b: string, c: string) => `linear-gradient(180deg, ${a} 0%, ${b} 48%, ${c} 100%)`;
const tinted = (light: string, dark: string, on: [string, string]): ToneMaterial => ({
  body: [light, dark],
  edge: [lit, litDark],
  ink: ["#ffffff", "#ffffff"],
  on,
});

const TONES: Record<CopyButtonTone | "error", ToneMaterial> = {
  green: tinted(grad("#4ade80", "#22c55e", "#16a34a"), grad("#4ade80", "#22c55e", "#15803d"), ["#16a34a", "#4ade80"]),
  blue: tinted(grad("#60a5fa", "#3b82f6", "#2563eb"), grad("#60a5fa", "#3b82f6", "#1d4ed8"), ["#2563eb", "#60a5fa"]),
  violet: tinted(grad("#a78bfa", "#8b5cf6", "#7c3aed"), grad("#a78bfa", "#8b5cf6", "#6d28d9"), ["#7c3aed", "#a78bfa"]),
  amber: {
    body: [grad("#fcd34d", "#fbbf24", "#f59e0b"), grad("#fcd34d", "#fbbf24", "#d97706")],
    edge: [
      "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.1), inset 0 0 0 1px rgba(146,64,14,0.18)",
      "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.08)",
    ],
    ink: ["#451a03", "#451a03"],
    on: ["#d97706", "#fbbf24"],
  },
  error: tinted(grad("#f87171", "#ef4444", "#dc2626"), grad("#f87171", "#ef4444", "#b91c1c"), ["#dc2626", "#f87171"]),
  mono: {
    body: [grad("#52525b", "#27272a", "#18181b"), grad("#ffffff", "#f4f4f5", "#d4d4d8")],
    edge: [
      "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(0,0,0,0.6)",
      "inset 0 1px 0 #ffffff, inset 0 -1px 0 rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.35)",
    ],
    ink: ["#ffffff", "#0a0a0a"],
    on: ["#0a0a0a", "#fafafa"],
  },
};

const SIZES: Record<CopyButtonSize, { box: number; icon: number; stroke: number; text: string; pad: string; radius: number }> = {
  sm: { box: 28, icon: 14, stroke: 1.75, text: "text-[12.5px]", pad: "pl-2 pr-2.5 gap-1.5", radius: 8 },
  md: { box: 34, icon: 16, stroke: 1.75, text: "text-[13.5px]", pad: "pl-2.5 pr-3 gap-1.5", radius: 10 },
  lg: { box: 42, icon: 18, stroke: 1.6, text: "text-[15px]", pad: "pl-3.5 pr-4 gap-2", radius: 12 },
};

const OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

// Choreography lives here, keyed on data-state, so a second press simply
// retargets the running transitions. The doubled class beats hover utilities.
const CSS = `
.wcb .wcb-i *{transform-box:fill-box;transform-origin:center}
.wcb .wcb-back{transition:transform 240ms ${OUT} 70ms,opacity 160ms linear 70ms}
.wcb .wcb-front{transition:transform 240ms ${OUT} 40ms,opacity 160ms linear 40ms}
.wcb .wcb-draw{stroke-dasharray:1;stroke-dashoffset:1;opacity:0;transition:stroke-dashoffset 150ms ${IN_OUT},opacity 90ms linear 70ms,transform 150ms ${IN_OUT}}
.wcb .wcb-check{transform:scale(.86)}
.wcb.wcb:not([data-state=idle]) .wcb-back{transform:translate(-3px,-3px) scale(.7);opacity:0;transition:transform 180ms ${IN_OUT},opacity 110ms linear}
.wcb.wcb:not([data-state=idle]) .wcb-front{transform:scale(.45) rotate(-14deg);opacity:0;transition:transform 200ms ${IN_OUT},opacity 130ms linear 40ms}
.wcb.wcb[data-state=copied] .wcb-check{stroke-dashoffset:0;opacity:1;transform:scale(1);transition:stroke-dashoffset 300ms ${OUT} 110ms,opacity 60ms linear 110ms,transform 320ms ${OUT} 100ms}
.wcb.wcb[data-state=error] .wcb-x{stroke-dashoffset:0;opacity:1;transition:stroke-dashoffset 180ms ${OUT} 110ms,opacity 60ms linear 110ms}
.wcb.wcb[data-state=error] .wcb-x2{transition-delay:190ms}
.wcb.wcb[data-state=error] .wcb-i{animation:wcb-shake 340ms ${IN_OUT} 160ms}
.wcb .wcb-lab{transition:transform 260ms ${OUT},opacity 180ms linear}
.wcb .wcb-lab-copied,.wcb .wcb-lab-failed{transform:translateY(80%);opacity:0}
.wcb.wcb:not([data-state=idle]) .wcb-lab-copy{transform:translateY(-80%);opacity:0}
.wcb.wcb[data-state=copied] .wcb-lab-copied,.wcb.wcb[data-state=error] .wcb-lab-failed{transform:none;opacity:1;transition-delay:60ms}
.wcb.wcb[data-appearance=solid]:not([data-state=idle]){color:var(--wcb-ink);text-shadow:0 1px 0 rgba(0,0,0,.1)}
.wcb.wcb[data-appearance=ghost]:not([data-state=idle]){color:var(--wcb-on)}
.wcb .wcb-fill{opacity:0;background:var(--wcb-body);box-shadow:var(--wcb-edge);transition:opacity 260ms linear}
.wcb[data-appearance=ghost] .wcb-fill{display:none}
.wcb.wcb:not([data-state=idle]) .wcb-fill{opacity:1;transition:opacity 60ms linear;animation:wcb-sweep 380ms ${OUT} both}
.wcb[data-sweep=false] .wcb-fill{animation:none!important}
@keyframes wcb-sweep{from{clip-path:circle(0px at var(--wcb-x) var(--wcb-y))}to{clip-path:circle(var(--wcb-r) at var(--wcb-x) var(--wcb-y))}}
@keyframes wcb-shake{0%,100%{transform:none}25%{transform:translateX(-1.5px)}50%{transform:translateX(1.5px)}75%{transform:translateX(-1px)}}
@media (prefers-reduced-motion:reduce){
.wcb .wcb-i *,.wcb .wcb-lab{transition-property:opacity,stroke-dashoffset!important;transition-duration:120ms!important;transition-delay:0ms!important;transform:none!important}
.wcb .wcb-draw{stroke-dashoffset:0}
.wcb .wcb-fill{animation:none!important}
.wcb.wcb .wcb-i{animation:none!important}
}
`;

async function writeClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for http pages and older browsers.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  area.style.pointerEvents = "none";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  if (!ok) throw new Error("Copy command was rejected");
}

type Sweep = { x: number; y: number; r: number; key: number };

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
  {
    value,
    variant = "icon",
    appearance = "solid",
    size = "md",
    tone = "green",
    timeout = 1600,
    sweep = true,
    labels,
    onCopied,
    onCopyError,
    onStateChange,
    onClick,
    className,
    style,
    disabled,
    type = "button",
    "aria-label": ariaLabel,
    ...rest
  },
  ref,
) {
  const [state, setState] = React.useState<CopyButtonState>("idle");
  const [spread, setSpread] = React.useState<Sweep>({ x: 0, y: 0, r: 0, key: 0 });
  const stateRef = React.useRef<CopyButtonState>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = React.useRef(0);

  const words = {
    copy: labels?.copy ?? "Copy",
    copied: labels?.copied ?? "Copied",
    failed: labels?.failed ?? "Failed",
  };

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = React.useCallback(
    (next: CopyButtonState) => {
      stateRef.current = next;
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;

    // Spread from the press point, or from the centre for keyboard presses.
    const rect = event.currentTarget.getBoundingClientRect();
    const fromPointer = event.detail > 0 && event.clientX !== 0;
    const x = fromPointer ? event.clientX - rect.left : rect.width / 2;
    const y = fromPointer ? event.clientY - rect.top : rect.height / 2;
    const r = Math.ceil(Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)));

    const id = ++run.current;
    if (timer.current) clearTimeout(timer.current);

    let result: CopyButtonState = "copied";
    try {
      const text = typeof value === "function" ? await value() : value;
      await writeClipboard(text);
      if (id !== run.current) return;
      onCopied?.(text);
    } catch (error) {
      if (id !== run.current) return;
      result = "error";
      onCopyError?.(error);
    }

    // Only a press from rest spreads again; a press while lit stays lit.
    if (stateRef.current === "idle") setSpread((prev) => ({ x, y, r, key: prev.key + 1 }));
    show(result);
    timer.current = setTimeout(
      () => {
        timer.current = null;
        show("idle");
      },
      result === "error" ? Math.max(timeout, 1800) : timeout,
    );
  };

  const s = SIZES[size];
  const m = TONES[state === "error" ? "error" : tone];
  const label = state === "copied" ? words.copied : state === "error" ? words.failed : words.copy;
  const isIcon = variant === "icon";
  const isSolid = appearance === "solid";

  const vars = {
    "--wcb-body-l": m.body[0],
    "--wcb-body-d": m.body[1],
    "--wcb-edge-l": m.edge[0],
    "--wcb-edge-d": m.edge[1],
    "--wcb-ink-l": m.ink[0],
    "--wcb-ink-d": m.ink[1],
    "--wcb-on-l": m.on[0],
    "--wcb-on-d": m.on[1],
    borderRadius: s.radius,
    height: s.box,
    ...(isIcon ? { width: s.box } : {}),
  } as React.CSSProperties;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      data-state={state}
      data-appearance={appearance}
      data-sweep={sweep ? "true" : "false"}
      aria-label={isIcon ? (ariaLabel ? (state === "idle" ? ariaLabel : `${ariaLabel}, ${label}`) : label) : ariaLabel}
      onClick={handleClick}
      className={cn(
        "wcb group/copy relative isolate inline-flex shrink-0 select-none items-center justify-center overflow-hidden border-0 font-sans font-medium tracking-[-0.01em]",
        "[--wcb-body:var(--wcb-body-l)] [--wcb-edge:var(--wcb-edge-l)] [--wcb-ink:var(--wcb-ink-l)] [--wcb-on:var(--wcb-on-l)]",
        "dark:[--wcb-body:var(--wcb-body-d)] dark:[--wcb-edge:var(--wcb-edge-d)] dark:[--wcb-ink:var(--wcb-ink-d)] dark:[--wcb-on:var(--wcb-on-d)]",
        "outline-none transition-[background-color,color,box-shadow] duration-150 ease-out",
        "focus-visible:ring-2 focus-visible:ring-neutral-900/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "dark:focus-visible:ring-white/70 dark:focus-visible:ring-offset-[#0a0a0b]",
        "disabled:pointer-events-none disabled:opacity-45",
        isSolid
          ? cn(
              "bg-[linear-gradient(180deg,#ffffff_0%,#f4f4f5_100%)] text-neutral-700",
              "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.09),0_1px_2px_rgba(0,0,0,0.06)]",
              "hover:text-neutral-950",
              "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.14),inset_0_0_0_1px_rgba(0,0,0,0.09)]",
              "dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.085)_0%,rgba(255,255,255,0.03)_100%)] dark:text-neutral-300",
              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.07),0_0_0_1px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.5),0_8px_20px_-10px_rgba(0,0,0,0.8)]",
              "dark:hover:text-white",
              "dark:active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(255,255,255,0.05),0_0_0_1px_rgba(0,0,0,0.5)]",
            )
          : cn(
              "bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200/70",
              "dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-neutral-100 dark:active:bg-white/[0.09]",
            ),
        !isIcon && s.pad,
        s.text,
        className,
      )}
      style={{ ...vars, ...style }}
      {...rest}
    >
      <style>{CSS}</style>

      {isSolid && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-150 group-hover/copy:opacity-100",
            "bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(0,0,0,0.04)_100%)]",
            "dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.015)_100%)]",
          )}
        />
      )}

      {isSolid && (
        <span
          key={spread.key}
          aria-hidden
          className="wcb-fill pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={
            {
              "--wcb-x": `${spread.x}px`,
              "--wcb-y": `${spread.y}px`,
              "--wcb-r": `${spread.r}px`,
            } as React.CSSProperties
          }
        />
      )}

      <svg
        aria-hidden
        className="wcb-i shrink-0 overflow-visible"
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={s.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path className="wcb-back" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        <rect className="wcb-front" x="8" y="8" width="12" height="12" rx="2.5" />
        <path className="wcb-draw wcb-check" pathLength={1} d="M4.5 12.75 9.25 17.5 19.5 6.75" />
        <path className="wcb-draw wcb-x" pathLength={1} d="M6.5 6.5 17.5 17.5" />
        <path className="wcb-draw wcb-x wcb-x2" pathLength={1} d="M17.5 6.5 6.5 17.5" />
      </svg>

      {!isIcon && (
        <span aria-hidden className="grid overflow-hidden whitespace-nowrap leading-[1.2]">
          <span className="wcb-lab wcb-lab-copy [grid-area:1/1]">{words.copy}</span>
          <span className="wcb-lab wcb-lab-copied [grid-area:1/1] font-semibold">{words.copied}</span>
          <span className="wcb-lab wcb-lab-failed [grid-area:1/1] font-semibold">{words.failed}</span>
        </span>
      )}

      {!isIcon && <span className="sr-only">{label}</span>}
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? `${words.copied} to clipboard` : state === "error" ? `Copy ${words.failed.toLowerCase()}` : ""}
      </span>
    </button>
  );
});
