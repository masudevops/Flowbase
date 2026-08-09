export const THEME_STORAGE_KEY = "kelbara-theme";

/// Runs before hydration (see RootLayout's beforeInteractive Script) so
/// the correct theme is already on <html> for the very first paint —
/// an explicit choice wins, otherwise falls back to the OS preference.
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();`;

// A tiny external store over `<html class="dark">` — module-scoped, so
// every ThemeToggle instance (desktop sidebar, mobile top bar, landing
// header, auth layout) reads and writes the same source of truth and
// stays in sync via useSyncExternalStore, instead of each holding its
// own React state that only its own click updates.
const listeners = new Set<() => void>();

export function subscribeToTheme(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getThemeSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function getThemeServerSnapshot(): boolean {
  return false;
}

export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage unavailable (private browsing, etc.) — the class toggle
    // above still applies for the current tab/session either way.
  }
  listeners.forEach((listener) => listener());
}
