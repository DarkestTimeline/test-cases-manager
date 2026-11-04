// Every page shares one content width, so the left edge stays put as you move
// between pages. "standard" (forms, detail pages) and "medium" (settings,
// profile, admin) keep their text narrower inside that same container.
export const PAGE = {
  full: "p-8 w-full max-w-6xl mx-auto",
  wide: "p-8 w-full max-w-6xl mx-auto",
  reports: "p-8 w-full max-w-6xl mx-auto",
  medium: "p-8 w-full max-w-6xl mx-auto [&>*]:max-w-3xl",
  standard: "p-8 w-full max-w-6xl mx-auto [&>*]:max-w-2xl",
  narrow: "p-8 w-full max-w-md mx-auto",
};
