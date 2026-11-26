"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  IconCheck,
  IconFile,
  IconFilePlus,
  IconFileText,
  IconFileZip,
  IconPhoto,
  IconPlus,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */

export type UploadFileStatus = "pending" | "uploading" | "success" | "error";

export type UploadFile = {
  id: string;
  file: File;
  /** Object URL for image previews — revoked on remove. */
  previewUrl?: string;
  progress: number;
  status: UploadFileStatus;
  error?: string;
};

export interface FileUploaderProps {
  /** Controlled file list. */
  value?: UploadFile[];
  /** Seed files for uncontrolled demos. */
  defaultValue?: UploadFile[];
  /** Fired whenever the file list changes. */
  onChange?: (files: UploadFile[]) => void;
  /**
   * Optional upload handler. Receives each new file and a progress callback.
   * When omitted, progress is simulated locally so demos feel alive.
   */
  onUpload?: (
    file: File,
    onProgress: (percent: number) => void,
  ) => Promise<void>;
  /** Fired when a file is removed. */
  onRemove?: (file: UploadFile) => void;
  /** HTML accept string, e.g. "image/*,.pdf". */
  accept?: string;
  /** Maximum number of files. Extra picks are ignored. */
  maxFiles?: number;
  /** Maximum bytes per file. Oversized files land as errors. */
  maxSize?: number;
  /** Label inside the solid choose button. */
  buttonLabel?: string;
  /** Supporting line under the button. */
  description?: string;
  /** Dropzone accent color. Hover/drag uses a darker mix. @default "#DC2F2F" */
  color?: string;
  /** Disable interaction. */
  disabled?: boolean;
  /** Allow selecting multiple files. @default true */
  multiple?: boolean;
  className?: string;
}

/* ─── Motion ────────────────────────────────────────────────── */

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
/** Exit must feel faster than enter — never ease-in on remove. */
const EXIT_MS = 160;

const listVariants: Variants = {
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

const tileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 32 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: EXIT_MS / 1000, ease: EASE_OUT },
  },
};

/* ─── Helpers ───────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createId(): string {
  return `fu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function FileTypeIcon({ file, className }: { file: File; className?: string }) {
  const type = file.type;
  if (type.startsWith("image/")) {
    return <IconPhoto className={className} stroke={1.75} />;
  }
  if (type.startsWith("video/")) {
    return <IconVideo className={className} stroke={1.75} />;
  }
  if (
    type.includes("zip") ||
    type.includes("gzip") ||
    type.includes("compressed") ||
    /\.(zip|rar|7z|tar|gz)$/i.test(file.name)
  ) {
    return <IconFileZip className={className} stroke={1.75} />;
  }
  if (
    type.includes("pdf") ||
    type.includes("text") ||
    type.includes("document") ||
    /\.(pdf|doc|docx|txt|md)$/i.test(file.name)
  ) {
    return <IconFileText className={className} stroke={1.75} />;
  }
  return <IconFile className={className} stroke={1.75} />;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === "*" || accept.trim() === "*/*") return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);
      return type.startsWith(prefix);
    }
    return type === token;
  });
}

async function simulateUpload(
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  const totalMs = Math.min(2200, Math.max(700, file.size / 8000));
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, totalMs / steps));
    onProgress(Math.round((i / steps) * 100));
  }
}

/* ─── Progress ring ─────────────────────────────────────────── */

function ProgressRing({
  progress,
  size = 36,
  stroke = 2.5,
  done,
  tone = "on-media",
}: {
  progress: number;
  size?: number;
  stroke?: number;
  done?: boolean;
  /** on-media = white ring for photo overlays; surface = theme-aware for doc cards */
  tone?: "on-media" | "surface";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, progress)) / 100) * c;
  const track =
    tone === "on-media"
      ? "text-white/20"
      : "text-black/10 dark:text-white/15";
  const active = done
    ? "text-emerald-500"
    : tone === "on-media"
      ? "text-white"
      : "text-neutral-950 dark:text-white";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className={track}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: done ? 0 : offset }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        className={active}
      />
    </svg>
  );
}

/* ─── File type mark (provided path) ────────────────────────── */

const FILE_STACK_PATH =
  "m56.936.888 30.189 1.054 7.998 8.577-1.473 42.182a2.5 2.5 0 0 1-2.421 2.411h-.165L69 54.341V58a2 2 0 0 1-2 2H31a2 2 0 0 1-2-2v-3.731l-24.064.84a2.5 2.5 0 0 1-2.575-2.247l-.011-.164L.675 4.728a2.5 2.5 0 0 1 2.247-2.575l.164-.011 30.189-1.054 7.242 6.753-.149.159h13.817l.165-4.7A2.5 2.5 0 0 1 56.771.887zM59.999 9H31a1 1 0 0 0-.993.883L30 10v29h20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H30v6a1 1 0 0 0 .883.993L31 59h36a1 1 0 0 0 .993-.883L68 58V17h-8zm-3.098-7.113a1.5 1.5 0 0 0-1.54 1.303l-.012.144L55.186 8H61l8 8v9.629a10.46 10.46 0 0 1 5.122-1.13c5.796.202 10.33 5.064 10.127 10.86s-5.064 10.329-10.86 10.126a10.5 10.5 0 0 1-4.39-1.13v8.986l22.1.772a1.5 1.5 0 0 0 1.54-1.303l.012-.144 1.428-40.975-7.493-.262-1-.035.297-8.496zm-24.799.24L3.121 3.142a1.5 1.5 0 0 0-1.445 1.407l-.002.145 1.675 47.97a1.5 1.5 0 0 0 1.407 1.445l.145.002 24.098-.841V52H28a1 1 0 0 1-1-1v-6.165l-7.405.258v.001l-1 .035-4.996.174-1 .036-.733-20.988L29 23.753V10a2 2 0 0 1 2-2h1.307zM59 50v1h-6v-1zm-26.685-8H30v7h1.303v-2.569h1.057c1.584 0 2.797-.717 2.797-2.269 0-1.627-1.213-2.162-2.842-2.162m6.19 0H36.54v7h2.034c2.18 0 3.506-1.21 3.506-3.532 0-2.312-1.326-3.468-3.573-3.468M48 42h-4.438v7h1.303v-2.922h2.674v-1.049h-2.674v-1.98H48zm-9.584 1.006c1.483 0 2.326.75 2.326 2.462 0 1.654-.777 2.46-2.151 2.522l-.175.004h-.573v-4.988zM59 45v1h-6v-1zm-26.787-2.005c1.09 0 1.663.29 1.663 1.167 0 .806-.467 1.223-1.431 1.27l-.187.004h-.955v-2.44zm36.814-16.244-.028.016v16.45a9.46 9.46 0 0 0 4.425 1.27c4.905.17 9.07-3.408 9.739-8.162l-9.442-.33.366-10.497a9.45 9.45 0 0 0-5.06 1.253M18.42 40.132l-4.997.175.14 3.996 4.997-.174zm8.593-.3-7.593.265.14 3.997 7.438-.26L27 40q0-.086.014-.168M59 40v1h-6v-1zm-40.753-4.865-4.997.175.14 3.997 4.996-.174zm10.752-.376-9.753.341.14 3.998 9.613-.336zM59 35v1H39v-1zm-40.928-4.862-4.997.175.14 3.997 4.997-.174zM29 29.756l-9.927.347.14 3.998L29 33.759zM59 30v1H39v-1zm-41.102-4.859-4.997.175.14 3.997 4.996-.174zm11.101-.387-10.102.353.14 3.997 9.962-.348zm32-15.34V16h6.585zm25.875-6.273-.254 7.289 7.29.254zM33.11 2.3l.2 5.7h5.911z";

function FileTypeCluster({
  dragging,
  reduce,
}: {
  dragging: boolean;
  reduce: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="flex items-center justify-center text-white"
      animate={
        reduce
          ? undefined
          : dragging
            ? { y: -3, scale: 1.04 }
            : { y: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <svg
        viewBox="0 0 96 62"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="h-14 w-[88px]"
      >
        <path d={FILE_STACK_PATH} />
      </svg>
    </motion.div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */

/**
 * FileUploader
 *
 * Media-first dropzone: bold empty state, then a living gallery of image
 * tiles + document cards with circular progress and spring layout.
 */
export function FileUploader({
  value: controlled,
  defaultValue = [],
  onChange,
  onUpload,
  onRemove,
  accept,
  maxFiles = 8,
  maxSize = 10 * 1024 * 1024,
  buttonLabel = "Choose files",
  description = "or drop files here",
  color = "#DC2F2F",
  disabled = false,
  multiple = true,
  className,
}: FileUploaderProps) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState<UploadFile[]>(defaultValue);
  const files = isControlled ? (controlled as UploadFile[]) : internal;
  const filesRef = React.useRef(files);
  filesRef.current = files;
  const reduce = useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const dragDepth = React.useRef(0);
  const pendingRevokes = React.useRef(new Set<string>());

  const setFiles = React.useCallback(
    (next: UploadFile[] | ((prev: UploadFile[]) => UploadFile[])) => {
      const resolved =
        typeof next === "function" ? next(filesRef.current) : next;
      filesRef.current = resolved;
      if (!isControlled) setInternal(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange],
  );

  const patchFile = React.useCallback(
    (id: string, patch: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [setFiles],
  );

  const runUpload = React.useCallback(
    async (entry: UploadFile) => {
      patchFile(entry.id, { status: "uploading", progress: 0, error: undefined });
      try {
        const handler = onUpload ?? simulateUpload;
        await handler(entry.file, (percent) => {
          patchFile(entry.id, {
            progress: Math.max(0, Math.min(100, percent)),
            status: "uploading",
          });
        });
        patchFile(entry.id, { status: "success", progress: 100 });
      } catch (err) {
        patchFile(entry.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [onUpload, patchFile],
  );

  const addFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      if (disabled) return;
      const list = Array.from(incoming);
      if (!list.length) return;

      const current = filesRef.current;
      const fileLimit = multiple ? maxFiles : 1;
      const room = Math.max(0, fileLimit - current.length);
      if (room === 0) return;

      const additions: UploadFile[] = [];
      for (const file of list.slice(0, room)) {
        if (!matchesAccept(file, accept)) {
          additions.push({
            id: createId(),
            file,
            progress: 0,
            status: "error",
            error: "File type not allowed",
          });
          continue;
        }
        if (file.size > maxSize) {
          additions.push({
            id: createId(),
            file,
            progress: 0,
            status: "error",
            error: `Too large · max ${formatBytes(maxSize)}`,
          });
          continue;
        }
        additions.push({
          id: createId(),
          file,
          previewUrl: isImageFile(file) ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: "pending",
        });
      }

      if (!additions.length) return;
      setFiles([...current, ...additions]);
      for (const entry of additions) {
        if (entry.status === "pending") {
          void runUpload(entry);
        }
      }
    },
    [accept, disabled, maxFiles, maxSize, multiple, runUpload, setFiles],
  );

  const removeFile = React.useCallback(
    (id: string) => {
      const target = filesRef.current.find((f) => f.id === id);
      if (!target) return;
      onRemove?.(target);
      setFiles(filesRef.current.filter((f) => f.id !== id));
      // Keep the object URL alive through the exit animation — revoking
      // immediately blanks the <img> mid-fade and reads as a glitch.
      if (target.previewUrl) {
        const url = target.previewUrl;
        pendingRevokes.current.add(url);
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          pendingRevokes.current.delete(url);
        }, EXIT_MS + 40);
      }
    },
    [onRemove, setFiles],
  );

  React.useEffect(() => {
    return () => {
      for (const url of pendingRevokes.current) {
        URL.revokeObjectURL(url);
      }
      pendingRevokes.current.clear();
      for (const f of filesRef.current) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
    };
  }, []);

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  const hasFiles = files.length > 0;
  const successCount = files.filter((f) => f.status === "success").length;
  const uploadingCount = files.filter(
    (f) => f.status === "uploading" || f.status === "pending",
  ).length;
  const fileLimit = multiple ? maxFiles : 1;
  const atLimit = files.length >= fileLimit;

  const openPicker = () => {
    if (!disabled && !atLimit) inputRef.current?.click();
  };

  // Resting uses the accent as-is; hover/drag deepens it gently.
  const colorVars = {
    ["--fu-color" as string]: color,
    ["--fu-color-active" as string]: `color-mix(in srgb, ${color} 88%, black)`,
    ["--fu-color-ring" as string]: `color-mix(in srgb, ${color} 35%, transparent)`,
  } as React.CSSProperties;

  return (
    <div className={cn("w-full max-w-2xl", className)} style={colorVars}>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled || atLimit}
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* ── Dropzone ── */}
      <motion.div
        layout={!reduce}
        transition={{ layout: { duration: 0.32, ease: EASE_OUT } }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "group relative overflow-hidden rounded-lg transition-[box-shadow] duration-200",
          hasFiles ? "p-0" : "bg-[var(--fu-color)] px-6 py-12 sm:py-14",
          !hasFiles && dragging && "shadow-[0_0_0_4px_var(--fu-color-ring)]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {!hasFiles ? (
          <>
            {/* Fill + dashed frame — hover darken stays inside the lines */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-3 rounded-md border border-dashed transition-[background-color,border-color] duration-200 sm:inset-4",
                dragging
                  ? "border-white bg-[var(--fu-color-active)]"
                  : "border-white/85 bg-transparent group-hover:border-white group-hover:bg-[var(--fu-color-active)]",
              )}
            />

            <div
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={buttonLabel}
              onClick={openPicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPicker();
                }
              }}
              className="relative flex cursor-pointer flex-col items-center text-center outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fu-color)]"
            >
              <FileTypeCluster dragging={dragging} reduce={Boolean(reduce)} />

              <motion.span
                layout={false}
                animate={
                  reduce
                    ? undefined
                    : dragging
                      ? { y: -2 }
                      : { y: 0 }
                }
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className={cn(
                  "mt-7 inline-flex h-12 items-center gap-2.5 rounded-md bg-white px-5 text-[14px] font-bold uppercase tracking-[0.04em] text-neutral-950",
                  "shadow-[0_1px_2px_rgba(0,0,0,.08),0_8px_20px_-10px_rgba(0,0,0,.25)]",
                  "pointer-events-none",
                )}
              >
                <IconFilePlus className="size-[18px]" stroke={2.25} />
                {dragging ? "Drop files" : buttonLabel}
              </motion.span>

              <p className="mt-4 text-[15px] font-medium text-white">
                {dragging ? "Release to upload" : description}
              </p>
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || atLimit}
            onClick={openPicker}
            aria-label={atLimit ? "Upload limit reached" : "Add more files"}
            className={cn(
              "group/add relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg bg-[var(--fu-color)] px-4 py-3.5 text-left transition-[box-shadow] duration-200",
              !disabled && !atLimit && "cursor-pointer",
              (disabled || atLimit) && "cursor-not-allowed opacity-55",
              dragging && "shadow-[0_0_0_4px_var(--fu-color-ring)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fu-color-ring)]",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-2 rounded-md border border-dashed transition-[background-color,border-color] duration-200",
                dragging
                  ? "border-white bg-[var(--fu-color-active)]"
                  : "border-white/80 bg-transparent",
                !dragging &&
                  !disabled &&
                  !atLimit &&
                  "group-hover/add:border-white group-hover/add:bg-[var(--fu-color-active)]",
              )}
            />
            <div className="relative flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-neutral-950">
                <IconPlus className="size-5" stroke={2.25} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold uppercase tracking-[0.03em] text-white">
                  {dragging
                    ? "Drop to add"
                    : atLimit
                      ? "Limit reached"
                      : "Add more"}
                </p>
                <p className="truncate text-[13px] font-medium text-white/85">
                  {uploadingCount > 0
                    ? `Uploading ${uploadingCount}…`
                    : `${successCount} ready · ${files.length}/${fileLimit}`}
                </p>
              </div>
            </div>
            {!atLimit ? (
              <span className="relative hidden shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.03em] text-neutral-950 sm:inline-flex">
                Browse
              </span>
            ) : null}
          </button>
        )}
      </motion.div>

      {/* ── Gallery ── */}
      <AnimatePresence initial={false}>
        {hasFiles ? (
          <motion.div
            key="gallery"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="mt-4"
          >
            <motion.ul
              layout={!reduce}
              variants={reduce ? undefined : listVariants}
              initial="hidden"
              animate="show"
              transition={{ layout: { duration: 0.22, ease: EASE_OUT } }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {files.map((item) => (
                  <motion.li
                    key={item.id}
                    layout={!reduce ? "position" : false}
                    variants={reduce ? undefined : tileVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    transition={{ layout: { duration: 0.22, ease: EASE_OUT } }}
                    className={cn(
                      item.previewUrl || isImageFile(item.file)
                        ? "col-span-1"
                        : "col-span-2 sm:col-span-3",
                    )}
                  >
                    {item.previewUrl || isImageFile(item.file) ? (
                      <ImageTile
                        item={item}
                        disabled={disabled}
                        onRemove={() => removeFile(item.id)}
                        reduce={Boolean(reduce)}
                      />
                    ) : (
                      <DocTile
                        item={item}
                        disabled={disabled}
                        onRemove={() => removeFile(item.id)}
                        reduce={Boolean(reduce)}
                      />
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ─── Image media tile ──────────────────────────────────────── */

function ImageTile({
  item,
  disabled,
  onRemove,
  reduce,
}: {
  item: UploadFile;
  disabled: boolean;
  onRemove: () => void;
  reduce: boolean;
}) {
  const isError = item.status === "error";
  const isSuccess = item.status === "success";
  const isBusy = item.status === "uploading" || item.status === "pending";

  return (
    <div
      className={cn(
        "group relative aspect-[4/5] overflow-hidden rounded-2xl border",
        "border-black/[0.08] bg-neutral-100 dark:border-white/[0.08] dark:bg-[#101014]",
        isError && "border-red-500/35 ring-1 ring-red-500/20",
      )}
    >
      {item.previewUrl ? (
        <img
          src={item.previewUrl}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover transition-[filter] duration-300",
            isBusy && "blur-[1px] brightness-75",
            isError && "grayscale-[0.4] brightness-75",
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-white/30">
          <IconPhoto className="size-8" stroke={1.5} />
        </div>
      )}

      {/* Bottom readable band */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-10">
        <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-white">
          {item.file.name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[12px] font-medium",
            isError ? "text-red-300" : "text-white/65",
          )}
        >
          {isError
            ? item.error ?? "Failed"
            : isBusy
              ? `${Math.round(item.progress)}%`
              : formatBytes(item.file.size)}
        </p>
      </div>

      {/* Upload overlay */}
      <AnimatePresence>
        {isBusy ? (
          <motion.div
            key="busy"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/25"
          >
            <div className="relative flex size-11 items-center justify-center">
              <ProgressRing progress={item.progress} size={44} stroke={2.75} />
              <span className="absolute text-[11px] font-semibold tabular-nums text-white">
                {Math.round(item.progress)}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Success badge */}
      <AnimatePresence>
        {isSuccess ? (
          <motion.span
            key="ok"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 28 }}
            className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,.7)]"
            aria-label="Uploaded"
          >
            <IconCheck className="size-3.5" stroke={2.5} />
          </motion.span>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove ${item.file.name}`}
        className={cn(
          "absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full",
          "bg-black/55 text-white backdrop-blur-sm transition-colors duration-150",
          "hover:bg-black/75",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          "disabled:pointer-events-none disabled:opacity-40",
          "active:scale-[0.97] motion-reduce:active:scale-100",
        )}
      >
        <IconX className="size-3.5" stroke={2.25} />
      </button>
    </div>
  );
}

/* ─── Document / non-image tile ─────────────────────────────── */

function DocTile({
  item,
  disabled,
  onRemove,
  reduce,
}: {
  item: UploadFile;
  disabled: boolean;
  onRemove: () => void;
  reduce: boolean;
}) {
  const isError = item.status === "error";
  const isSuccess = item.status === "success";
  const isBusy = item.status === "uploading" || item.status === "pending";

  return (
    <div
      className={cn(
        "rounded-[14px] border p-1",
        isError
          ? "border-red-500/25 bg-red-500/[0.08]"
          : isSuccess
            ? "border-emerald-500/25 bg-emerald-500/[0.08]"
            : "border-black/[0.08] bg-neutral-100/80 dark:border-white/[0.08] dark:bg-white/[0.04]",
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-[10px] border px-3 py-2.5",
          isError
            ? "border-red-500/15 bg-white/90 dark:bg-black/40"
            : isSuccess
              ? "border-emerald-500/15 bg-white/90 dark:bg-black/40"
              : "border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.03]",
        )}
      >
        <div
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-lg",
            isError
              ? "bg-red-500 text-white"
              : isSuccess
                ? "bg-emerald-500 text-white"
                : isBusy
                  ? "bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-white"
                  : "bg-neutral-900 text-white dark:bg-white/10 dark:text-white",
          )}
        >
          {isBusy ? (
            <ProgressRing
              progress={item.progress}
              size={24}
              stroke={2.25}
              done={false}
              tone="surface"
            />
          ) : isSuccess ? (
            <motion.span
              initial={reduce ? false : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 480, damping: 28 }}
            >
              <IconCheck className="size-4" stroke={2.5} />
            </motion.span>
          ) : isError ? (
            <IconX className="size-4" stroke={2.5} />
          ) : (
            <FileTypeIcon file={item.file} className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold tracking-[-0.015em] text-neutral-950 dark:text-white">
            {item.file.name}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[12.5px] font-medium",
              isError
                ? "text-red-600 dark:text-red-400"
                : "text-neutral-500 dark:text-white/45",
            )}
          >
            {isError
              ? item.error ?? "Upload failed"
              : isBusy
                ? `Uploading · ${Math.round(item.progress)}%`
                : isSuccess
                  ? `Ready · ${formatBytes(item.file.size)}`
                  : formatBytes(item.file.size)}
          </p>

          {isBusy ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.1]">
              <motion.div
                className="h-full rounded-full bg-neutral-950 dark:bg-white"
                initial={false}
                animate={{ width: `${item.progress}%` }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }
                }
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove ${item.file.name}`}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors duration-150",
            "hover:bg-black/[0.06] hover:text-neutral-900",
            "dark:text-white/45 dark:hover:bg-white/[0.08] dark:hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40",
            "disabled:pointer-events-none disabled:opacity-40",
            "active:scale-[0.97] motion-reduce:active:scale-100",
          )}
        >
          <IconX className="size-4" stroke={2} />
        </button>
      </div>
    </div>
  );
}
