"use client";

// Inline script that sets the theme before the first paint. It is rendered
// into the server's HTML only. React refuses to create <script> tags in the
// browser ("Encountered a script tag while rendering React component"), which
// is exactly what happens if the page root is ever rebuilt there, so on the
// client this renders nothing. The browser has already run the script by then.
export default function ThemeScript({ code }) {
  if (typeof window !== "undefined") return null;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
