"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  IconCheck,
  IconChevronDown,
  IconBolt,
  IconBrain,
  IconSparkles,
  IconAtom,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface ModelOption {
  id: string;
  label: string;
  description?: string;
  /** Tabler icon component (or any ReactNode renderer). */
  icon?: React.ReactNode;
  badge?: string;
}

export interface ModelContextSwitcherProps {
  options?: ModelOption[];
  /** Controlled selected id. */
  value?: string;
  /** Default selected id (uncontrolled). */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Visual size of the trigger button. */
  size?: "sm" | "md";
  /** Optional label rendered before the model name in the trigger. */
  triggerLabel?: string;
  className?: string;
}

const DEFAULT_OPTIONS: ModelOption[] = [
  {
    id: "fast",
    label: "Wensity Fast",
    description: "Snappy responses for short prompts.",
    icon: <IconBolt size={16} stroke={2} />,
  },
  {
    id: "thinking",
    label: "Wensity Thinking",
    description: "Multi-step reasoning, slower.",
    icon: <IconBrain size={16} stroke={2} />,
  },
  {
    id: "creative",
    label: "Wensity Creative",
    description: "Higher temperature, more invention.",
    icon: <IconSparkles size={16} stroke={2} />,
  },
  {
    id: "research",
    label: "Wensity Research",
    description: "Long-context with web tools.",
    icon: <IconAtom size={16} stroke={2} />,
  },
];

const MODEL_MATTE_NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.65 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

/**
 * ModelContextSwitcher
 *
 * Base UI menu with a Framer Motion entry that scales out from the trigger
 * (the positioner's `--transform-origin`), and a `layoutId` selection pill that
 * physically glides between items on hover / arrow-key focus.
 *
 * Animation rules:
 *  - Tight pop spring: stiffness 400, damping 25
 *  - filter: blur(8px) → blur(0px) on entrance for a glass feel
 *  - Only `transform`, `opacity`, and `filter` animate
 */
export function ModelContextSwitcher({
  options = DEFAULT_OPTIONS,
  value,
  defaultValue,
  onChange,
  size = "md",
  triggerLabel,
  className,
}: ModelContextSwitcherProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string>(
    defaultValue ?? options[0]?.id ?? ""
  );
  const [open, setOpen] = React.useState(false);
  const [hoverId, setHoverId] = React.useState<string | null>(null);

  const selectedId = isControlled ? value! : internal;
  const selected =
    options.find((o) => o.id === selectedId) ?? options[0];

  function select(id: string) {
    if (!isControlled) setInternal(id);
    onChange?.(id);
    setOpen(false);
  }

  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-black/[0.08]",
          "bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,#ffffff_0%,#f4f4f5_72%)]",
          "text-[var(--foreground)] outline-none transition-colors",
          "hover:border-black/[0.14] focus-visible:ring-2 focus-visible:ring-black/10",
          size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]",
          "shadow-[0_1px_2px_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.08)]",
          "dark:border-white/[0.06] dark:bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,#15151b_0%,#0a0a0b_72%)]",
          "dark:hover:border-white/[0.12] dark:focus-visible:ring-white/10 dark:shadow-[0_1px_2px_rgba(0,0,0,.4),0_8px_24px_-12px_rgba(0,0,0,.6)]",
          className
        )}
        aria-label="Select model"
      >
        <span className="grid h-5 w-5 place-items-center text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
          {selected?.icon ?? <IconBolt size={16} />}
        </span>
        <span className="font-medium tracking-tight">
          {triggerLabel ? (
            <span className="text-[var(--muted-foreground)] mr-1.5">
              {triggerLabel}
            </span>
          ) : null}
          {selected?.label}
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="text-[var(--muted-foreground)]"
          style={{ willChange: "transform" }}
        >
          <IconChevronDown size={14} stroke={2} />
        </motion.span>
      </Menu.Trigger>

      {/* keepMounted + AnimatePresence lets Framer Motion own the exit. */}
      <AnimatePresence>
        {open && (
          <Menu.Portal keepMounted>
            <Menu.Positioner sideOffset={8} align="end" className="z-50 outline-none">
              <Menu.Popup
                finalFocus={false}
                render={
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.92,
                      y: -6,
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      y: -4,
                      filter: "blur(6px)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                    style={{
                      transformOrigin: "var(--transform-origin)",
                      willChange: "transform, opacity, filter",
                    }}
                  />
                }
                className={cn(
                  "relative isolate z-50 w-[300px] overflow-hidden rounded-2xl outline-none border border-black/[0.08] p-1.5",
                  "bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,#ffffff_0%,#f4f4f5_72%)]",
                  "shadow-[0_1px_2px_rgba(0,0,0,.06),0_24px_60px_-18px_rgba(0,0,0,.22)]",
                  "dark:border-white/[0.06] dark:bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,#15151b_0%,#0a0a0b_72%)]",
                  "dark:shadow-[0_1px_2px_rgba(0,0,0,.4),0_24px_60px_-16px_rgba(0,0,0,.72)]"
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay dark:opacity-[0.055]"
                  style={{ backgroundImage: MODEL_MATTE_NOISE, backgroundSize: "240px 240px" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.035)_0%,transparent_30%,transparent_72%,rgba(0,0,0,0.055)_100%)] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12)_0%,transparent_28%,transparent_72%,rgba(0,0,0,0.22)_100%)]"
                />
                <LayoutGroup id="model-switcher">
                  <div
                    className="relative z-10 flex flex-col"
                    onMouseLeave={() => setHoverId(null)}
                  >
                    {options.map((opt) => {
                      const isSelected = opt.id === selectedId;
                      const isHover = hoverId === opt.id;
                      return (
                        <Menu.Item
                          key={opt.id}
                          onClick={() => select(opt.id)}
                          onMouseEnter={() => setHoverId(opt.id)}
                          onFocus={() => setHoverId(opt.id)}
                          className={cn(
                            "relative flex w-full cursor-default items-start gap-3 rounded-xl px-3 py-2.5 text-left outline-none",
                            "transition-colors",
                            isHover
                              ? "text-[var(--foreground)]"
                              : "text-[var(--foreground)]/85"
                          )}
                        >
                          {isHover && (
                            <motion.span
                              layoutId="model-switcher-pill"
                              className={cn(
                                "absolute inset-0 rounded-xl",
                                "bg-[var(--surface-muted)]",
                                "ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
                              )}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 32,
                                mass: 0.6,
                              }}
                              style={{ willChange: "transform" }}
                              aria-hidden
                            />
                          )}

                          <span
                            className={cn(
                              "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                              // Default: neutral icon — every model SHOULDN'T
                              // look "active" in the unselected state.
                              isSelected
                                ? "bg-white text-[var(--foreground)] dark:bg-white/[0.08]"
                                : "bg-[var(--surface-muted)] text-[var(--muted-foreground)]",
                              isHover &&
                                "bg-white dark:bg-white/[0.08]"
                            )}
                          >
                            {opt.icon ?? <IconBolt size={16} />}
                          </span>

                          <span className="relative z-10 flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold tracking-tight">
                                {opt.label}
                              </span>
                            </span>
                            {opt.description && (
                              <span className="mt-0.5 truncate text-[11.5px] text-[var(--muted-foreground)]">
                                {opt.description}
                              </span>
                            )}
                          </span>

                          <span className="relative z-10 grid h-5 w-5 shrink-0 place-items-center">
                            <AnimatePresence>
                              {isSelected && (
                                <motion.span
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 28,
                                  }}
                                  className="text-[var(--foreground)]"
                                  style={{ willChange: "transform" }}
                                >
                                  <IconCheck size={14} stroke={3} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        </Menu.Item>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </AnimatePresence>
    </Menu.Root>
  );
}
