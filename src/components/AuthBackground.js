"use client";

import { useEffect, useRef } from "react";

// 24x24 stroke icons, drawn on a canvas. Bugs show up most often.
const ICON_PATHS = {
  bug: "M8 2l2 2 M16 2l-2 2 M9 7.5v-1a3 3 0 0 1 6 0v1 M12 21c-3.3 0-6-2.7-6-6v-3.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V15c0 3.3-2.7 6-6 6z M12 21V11 M6 11.5C4.3 11.3 3 9.9 3 8 M18 11.5c1.7-.2 3-1.6 3-3.5 M6 15H2.5 M21.5 15H18 M6.5 19c-1.8.2-3 1.6-3 3 M17.5 19c1.8.2 3 1.6 3 3",
  check:
    "M6 3.5h12A2.5 2.5 0 0 1 20.5 6v12a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5z M8 12.5l3 3 5-6",
  clipboard:
    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M10 3h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M8.5 12h7 M8.5 16h5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20.5 20.5l-4.7-4.7",
  shield:
    "M12 3l7 3v5.5c0 4.4-2.9 7.8-7 9.5-4.1-1.7-7-5.1-7-9.5V6l7-3z M9 12l2.2 2.2L15 10",
  flask:
    "M9.5 3h5 M10 3v6.2L5.3 17.5A2.2 2.2 0 0 0 7.2 21h9.6a2.2 2.2 0 0 0 1.9-3.5L14 9.2V3 M7.5 14.5h9",
  play: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M10 8.5l6 3.5-6 3.5v-7z",
  flag: "M5 21V4 M5 4.5h11l-2 4 2 4H5",
  fail: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9 9l6 6 M15 9l-6 6",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
};

const ICON_SEQUENCE = [
  "bug", "bug", "bug", "bug", "check", "clipboard", "search", "shield",
  "flask", "play", "flag", "fail", "chart",
];

const PRIMARY = [59, 130, 246];
const BASE_LIGHT = { rgb: [100, 116, 139], alpha: 0.4 };
const BASE_DARK = { rgb: [148, 163, 184], alpha: 0.26 };

const ICON_SIZE = 15; // px at rest
const GROW = 1.15; // extra size factor right under the cursor
const REACH = 120; // px: how far the cursor's influence extends
const GLOW_RADIUS = 280;

function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// A field of QA-themed icons. Icons near the pointer grow and light up (like
// a dock) and a soft glow follows the pointer.
export default function AuthBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const paths = Object.fromEntries(
      Object.entries(ICON_PATHS).map(([name, d]) => [name, new Path2D(d)]),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cells = [];
    let rest = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let activeTarget = 0;
    let active = 0;
    let frame = 0;

    function layout() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const spacing = Math.max(48, Math.round(width / 40));
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      cells = [];
      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const h = hash(c + 50, r + 50);
          cells.push({
            x: c * spacing + (r % 2 ? spacing / 2 : 0),
            y: r * spacing,
            icon: ICON_SEQUENCE[h % ICON_SEQUENCE.length],
            rotation: (((h >> 8) % 41) - 20) * (Math.PI / 180),
          });
        }
      }

      rest = { x: width / 2, y: height * 0.2 };
      if (active === 0) {
        target = { ...rest };
        current = { ...rest };
      }
    }

    function draw() {
      const dark = document.documentElement.classList.contains("dark");
      const base = dark ? BASE_DARK : BASE_LIGHT;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // soft glow that trails the pointer
      const glow = ctx.createRadialGradient(
        current.x, current.y, 0, current.x, current.y, GLOW_RADIUS,
      );
      const glowAlpha = (dark ? 0.2 : 0.14) * (0.55 + 0.45 * active);
      glow.addColorStop(0, `rgba(${PRIMARY.join(",")},${glowAlpha})`);
      glow.addColorStop(1, `rgba(${PRIMARY.join(",")},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // keep the area behind the form calm so text stays readable
      const calmX = Math.min(270, width * 0.42);
      const calmY = Math.min(380, height * 0.45);

      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const cell of cells) {
        const dx = cell.x - current.x;
        const dy = cell.y - current.y;
        const dist = Math.hypot(dx, dy);
        const focus = Math.exp(-((dist / REACH) ** 2)) * active;

        const q = Math.hypot(
          (cell.x - width / 2) / calmX,
          (cell.y - height / 2) / calmY,
        );
        const calm = smoothstep(0.8, 1.2, q);

        const baseAlpha = base.alpha * calm;
        const alpha = baseAlpha + (0.95 - baseAlpha) * focus;
        if (alpha < 0.02) continue;

        const scale = ((ICON_SIZE * (1 + GROW * focus)) / 24);
        const push = dist > 0 ? (focus * 16) / dist : 0;
        const x = cell.x + dx * push;
        const y = cell.y + dy * push;
        const angle = cell.rotation * (1 - focus);
        const cos = Math.cos(angle) * scale;
        const sin = Math.sin(angle) * scale;

        ctx.setTransform(
          dpr * cos, dpr * sin, -dpr * sin, dpr * cos,
          dpr * (x - 12 * cos + 12 * sin),
          dpr * (y - 12 * sin - 12 * cos),
        );

        const r = Math.round(base.rgb[0] + (PRIMARY[0] - base.rgb[0]) * focus);
        const g = Math.round(base.rgb[1] + (PRIMARY[1] - base.rgb[1]) * focus);
        const b = Math.round(base.rgb[2] + (PRIMARY[2] - base.rgb[2]) * focus);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.stroke(paths[cell.icon]);
      }
    }

    function tick() {
      frame = 0;
      current.x += (target.x - current.x) * 0.16;
      current.y += (target.y - current.y) * 0.16;
      active += (activeTarget - active) * 0.12;
      draw();

      const settling =
        Math.abs(target.x - current.x) > 0.3 ||
        Math.abs(target.y - current.y) > 0.3 ||
        Math.abs(activeTarget - active) > 0.005;
      if (settling) schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function handleMove(event) {
      const rect = canvas.getBoundingClientRect();
      target = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      activeTarget = 1;
      schedule();
    }

    function handleLeave() {
      target = { ...rest };
      activeTarget = 0;
      schedule();
    }

    layout();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      layout();
      schedule();
    });
    resizeObserver.observe(canvas.parentElement);

    // repaint when the theme is toggled
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    if (!reduceMotion) {
      window.addEventListener("pointermove", handleMove);
      document.documentElement.addEventListener("pointerleave", handleLeave);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
