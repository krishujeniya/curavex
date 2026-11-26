"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Underline Animation
 *
 * Animated link underlines in pure CSS. The line is painted as a background
 * on the inline element, not a pseudo-element, so it follows the text across
 * line breaks: every wrapped line gets its own underline (box-decoration-break
 * clone).
 *
 * Variants:
 * - slide: draws in from the left on hover and leaves to the right, so the
 *   line always travels in reading direction.
 * - center: grows out from the middle and shrinks back into it.
 * - fill: a thin line at rest that floods up behind the words on hover.
 * - wavy: a wave that draws in from the left and pulls back to it. The wave is
 *   an SVG pattern sized in pixels, so it grows in length without stretching.
 * - gradient: the slide motion with a two-color gradient line.
 *
 * Hover, keyboard focus and `active` all show the line, so the current page in
 * a nav can keep its underline. `rest` keeps a faint line visible at rest, so
 * links in body copy stay discoverable. Reduced motion shows the line at once.
 *
 * The stylesheet is injected once and needs no global CSS or Tailwind config.
 * It sets no text color, so color classes passed in className always apply.
 */

export type UnderlineAnimationVariant = "slide" | "center" | "fill" | "wavy" | "gradient";

type UnderlineOptions = {
  /** Motion and shape of the line. Default slide. */
  variant?: UnderlineAnimationVariant;
  /** Line color, any CSS color. Default the text color. */
  color?: string;
  /** Gradient start and end colors for the gradient variant. */
  from?: string;
  to?: string;
  /** Line thickness in pixels. Default 2. */
  thickness?: number;
  /** Gap between the text and the line in pixels. Default 2. */
  offset?: number;
  /** Animation length in milliseconds. Default 420. */
  duration?: number;
  /** Keeps a faint line visible at rest, for links in running text. Default false. */
  rest?: boolean;
  /** Shows the line permanently, such as the current page in a nav. Default false. */
  active?: boolean;
  /** Element to render. Default a link when `href` is set, else a span. */
  as?: "a" | "span" | "button";
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export type UnderlineAnimationProps = UnderlineOptions &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof UnderlineOptions>;

const STYLE_ID = "wensity-underline-animation";

/*
 * Every variant paints with backgrounds or text-decoration on the element
 * itself, sized by custom properties, so one rule set serves all of them.
 * Layer 1 is the animated line, layer 2 the optional resting line.
 */
const CSS = `
.wua {
  --wua-color: currentColor;
  --wua-rest-color: transparent;
  --wua-t: 2px;
  --wua-o: 2px;
  --wua-d: 420ms;
  --wua-ease: cubic-bezier(0.65, 0, 0.35, 1);
  column-rule-color: var(--wua-color);
  text-decoration: none;
  cursor: pointer;
  background-repeat: no-repeat;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding-bottom: calc(var(--wua-o) + var(--wua-t));
  outline: none;
}
.wua:focus-visible {
  border-radius: 2px;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--wua-color) 35%, transparent);
}
.wua[data-variant="slide"],
.wua[data-variant="center"],
.wua[data-variant="gradient"] {
  background-image: linear-gradient(var(--wua-color), var(--wua-color)), linear-gradient(var(--wua-rest-color), var(--wua-rest-color));
  background-size: 0% var(--wua-t), 100% var(--wua-t);
  background-position: 100% 100%, 0 100%;
  transition: background-size var(--wua-d) var(--wua-ease);
}
.wua[data-variant="center"] { background-position: 50% 100%, 0 100%; }
.wua[data-variant="gradient"] {
  background-image: linear-gradient(90deg, var(--wua-from), var(--wua-to)), linear-gradient(var(--wua-rest-color), var(--wua-rest-color));
}
.wua[data-variant="slide"]:is(:hover, :focus-visible, [data-active="true"]),
.wua[data-variant="gradient"]:is(:hover, :focus-visible, [data-active="true"]) {
  background-size: 100% var(--wua-t), 100% var(--wua-t);
  background-position: 0 100%, 0 100%;
}
.wua[data-variant="center"]:is(:hover, :focus-visible, [data-active="true"]) {
  background-size: 100% var(--wua-t), 100% var(--wua-t);
}
.wua[data-variant="fill"] {
  background-image: linear-gradient(var(--wua-color), var(--wua-color)), linear-gradient(color-mix(in srgb, var(--wua-color) 16%, transparent), color-mix(in srgb, var(--wua-color) 16%, transparent));
  background-size: 100% var(--wua-t), 100% 0%;
  background-position: 0 100%, 0 100%;
  transition: background-size var(--wua-d) var(--wua-ease);
}
.wua[data-variant="fill"]:is(:hover, :focus-visible, [data-active="true"]) {
  background-size: 100% var(--wua-t), 100% 100%;
}
.wua[data-variant="wavy"] {
  background-image: var(--wua-wave, none), var(--wua-wave-rest, none);
  background-size: 0% var(--wua-wh, 6px), 100% var(--wua-wh, 6px);
  background-position: 0 100%, 0 100%;
  padding-bottom: calc(var(--wua-o) + var(--wua-wh, 6px));
  transition: background-size var(--wua-d) var(--wua-ease);
}
.wua[data-variant="wavy"]:is(:hover, :focus-visible, [data-active="true"]) {
  background-size: 100% var(--wua-wh, 6px), 100% var(--wua-wh, 6px);
}
@media (prefers-reduced-motion: reduce) {
  .wua { transition: none !important; }
}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/**
 * The wave as a tiled SVG pattern. The SVG has no viewBox, so its units are
 * CSS pixels: however wide the background grows, the wave keeps its period.
 */
function waveImage(color: string, thickness: number, opacity: number) {
  const stroke = Math.max(1, thickness * 0.8);
  const amplitude = 1.5 + thickness * 0.6;
  const height = Math.ceil(amplitude * 2 + stroke + 1);
  const period = Math.round(amplitude * 6);
  const mid = height / 2;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='${height}'>` +
    `<defs><pattern id='w' width='${period}' height='${height}' patternUnits='userSpaceOnUse'>` +
    `<path d='M0 ${mid} Q${period / 4} ${mid - amplitude} ${period / 2} ${mid} T${period} ${mid}' fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='${stroke}' stroke-linecap='round'/>` +
    `</pattern></defs><rect width='100%' height='${height}' fill='url(#w)'/></svg>`;
  return { url: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, height };
}

export function UnderlineAnimation({
  variant = "slide",
  color,
  from = "#f43f5e",
  to = "#8b5cf6",
  thickness = 2,
  offset = 2,
  duration = 420,
  rest: showRest = false,
  active = false,
  as,
  href,
  className,
  style,
  children,
  ...props
}: UnderlineAnimationProps) {
  React.useEffect(() => {
    ensureStyles();
  }, []);

  // The wave is an image, and an image cannot read the page's colors, so the
  // line color is resolved first. It is routed through column-rule-color (see
  // the stylesheet), so the browser resolves currentColor, var() and inherited
  // text color in the element's own context, then hands back a concrete rgb()
  // for the SVG. No React state is involved: the result goes straight into
  // custom properties.
  const [node, setNode] = React.useState<HTMLElement | null>(null);
  const settings = React.useRef({ variant, thickness, showRest });
  const paintWave = React.useCallback(() => {
    const { variant: v, thickness: t, showRest: r } = settings.current;
    if (!node || v !== "wavy") return;
    const ink = getComputedStyle(node).columnRuleColor;
    const line = waveImage(ink, t, 1);
    node.style.setProperty("--wua-wave", line.url);
    node.style.setProperty("--wua-wh", `${line.height}px`);
    if (r) node.style.setProperty("--wua-wave-rest", waveImage(ink, t, 0.28).url);
    else node.style.removeProperty("--wua-wave-rest");
  }, [node]);

  // Repaint after every render: a new element (span to link), a new color prop,
  // a style or class change that recolors the text all land here. It is one
  // style read and one short string.
  React.useLayoutEffect(() => {
    settings.current = { variant, thickness, showRest };
    paintWave();
  });

  // Colors can also change with no render at all, when the page theme flips.
  React.useEffect(() => {
    if (!node || variant !== "wavy") return;
    const observer = new MutationObserver(paintWave);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    return () => observer.disconnect();
  }, [node, variant, paintWave]);

  const Element = as ?? (href ? "a" : "span");
  const vars = {
    ...(color ? { "--wua-color": color } : null),
    "--wua-rest-color": showRest ? `color-mix(in srgb, ${color ?? "currentColor"} 28%, transparent)` : "transparent",
    "--wua-t": `${thickness}px`,
    "--wua-o": `${offset}px`,
    "--wua-d": `${duration}ms`,
    "--wua-from": from,
    "--wua-to": to,
  } as React.CSSProperties;

  return React.createElement(
    Element,
    {
      ...props,
      ref: setNode,
      ...(Element === "a" ? { href } : null),
      ...(Element === "button" ? { type: "button" } : null),
      "data-variant": variant,
      "data-active": active ? "true" : undefined,
      "aria-current": active && Element === "a" ? (props["aria-current"] ?? "page") : props["aria-current"],
      className: cn("wua", className),
      style: { ...vars, ...style },
    },
    children,
  );
}
