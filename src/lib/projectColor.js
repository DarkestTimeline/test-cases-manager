// A stable accent color per project, derived from its code, so each project
// is recognisable at a glance. Full class names are listed so Tailwind keeps them.
const TILE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-sky-100 text-sky-700",
  "bg-purple-100 text-purple-700",
  "bg-indigo-100 text-indigo-700",
  "bg-red-100 text-red-700",
  "bg-violet-100 text-violet-700",
  "bg-slate-200 text-slate-700",
];

// FNV-1a plus a final mix, so similar codes (DEMOAPI, DEMOIOS) land far apart.
function hashCode(code) {
  let h = 2166136261;
  for (const ch of code) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

export function projectTileColor(code) {
  return TILE_COLORS[hashCode(code) % TILE_COLORS.length];
}

// "Demo Storefront — iOS" -> "DSI"; a one-word name falls back to the code.
export function projectInitials(name, code) {
  const words = (name || "").split(/[\s\u2014\u2013-]+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return code.slice(0, 2);
}
