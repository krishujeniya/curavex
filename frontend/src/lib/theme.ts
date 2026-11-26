export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "curavex-theme";

/** Resolve stored or system-preferred theme mode. */
export function resolveTheme(
  stored: string | null | undefined,
  systemPrefersDark: boolean,
): ThemeMode {
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return systemPrefersDark ? "dark" : "light";
}

/** Apply theme attributes and classes onto documentElement and theme-color meta tags. */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");

  const metaColor = theme === "dark" ? "#050505" : "#ffffff";
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
    el.setAttribute("content", metaColor);
  });
}

/** Persist and apply a theme selection safely. */
export function persistTheme(theme: ThemeMode): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be disabled in private contexts.
  }
}

/** Read current active theme from the DOM. */
export function readCurrentTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
