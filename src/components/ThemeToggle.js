"use client";

import { MoonIcon, SunIcon } from "./icons";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.contains("dark") ? "light" : "dark";
  root.classList.toggle("dark", next === "dark");
  document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
}

// Which icon/label shows is decided by CSS (the "dark" class on <html>),
// so the server and client render identical markup.
export default function ThemeToggle({ variant = "sidebar", collapsed = false }) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoonIcon size={18} className="dark:hidden" />
        <SunIcon size={18} className="hidden dark:block" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title={collapsed ? "Toggle dark mode" : undefined}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-dim transition-colors hover:bg-sidebar-hover/60 hover:text-white ${
        collapsed ? "md:justify-center md:px-0" : ""
      }`}
    >
      <span className="shrink-0">
        <MoonIcon size={20} className="dark:hidden" />
        <SunIcon size={20} className="hidden dark:block" />
      </span>
      <span className={collapsed ? "md:hidden" : ""}>
        <span className="dark:hidden">Dark mode</span>
        <span className="hidden dark:inline">Light mode</span>
      </span>
    </button>
  );
}
