"use client";

import { useEffect } from "react";

// Puts the saved theme (cookie), or the operating system preference, back on
// <html> whenever the page mounts. Normally the inline script in app/layout.js
// and the server-rendered class already did this; this is the safety net for
// when the page root is rebuilt in the browser, which resets <html>'s classes.
export default function ThemeSync() {
  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )theme=(light|dark)/);
    const dark = saved
      ? saved[1] === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return null;
}
