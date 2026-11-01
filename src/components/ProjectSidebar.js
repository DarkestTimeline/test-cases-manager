"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StartRunButton from "./StartRunButton";

const SECTIONS = [
  { slug: "test-cases", label: "Test Cases" },
  { slug: "modules", label: "Modules" },
  { slug: "suites", label: "Suites" },
  { slug: "runs", label: "Runs" },
  { slug: "reports", label: "Reports" },
  { slug: "settings", label: "Import / Export" },
];

const ITEM_BASE =
  "block px-4 py-2 text-sm border-l-2 transition-colors";
const ITEM_ACTIVE =
  "border-primary bg-slate-50 text-primary font-semibold";
const ITEM_IDLE =
  "border-transparent text-slate-600 hover:bg-slate-50 hover:text-primary";

export default function ProjectSidebar({ project, projects, suites }) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);
  const base = `/projects/${project.code}`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Switching projects keeps you in the same section (list level only).
  function hrefForProject(code) {
    const section = pathname.split("/")[3];
    return SECTIONS.some((s) => s.slug === section)
      ? `/projects/${code}/${section}`
      : `/projects/${code}`;
  }

  function closeAll() {
    setIsNavOpen(false);
    setIsSwitcherOpen(false);
  }

  return (
    <aside className="md:w-60 md:shrink-0 bg-white border-b md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 p-3 md:block">
        <div className="relative flex-1 min-w-0" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            aria-expanded={isSwitcherOpen}
            className="w-full flex items-center gap-2 rounded p-2 text-left hover:bg-slate-50"
          >
            <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              {project.code}
            </span>
            <span className="flex-1 truncate font-semibold text-slate-900">
              {project.name}
            </span>
            <span className="text-xs text-slate-500">
              {isSwitcherOpen ? "▲" : "▼"}
            </span>
          </button>

          {isSwitcherOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 max-h-72 overflow-auto">
              {projects.map((p) => (
                <Link
                  key={p.code}
                  href={hrefForProject(p.code)}
                  onClick={closeAll}
                  className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 ${
                    p.code === project.code
                      ? "font-semibold text-primary"
                      : "text-slate-600"
                  }`}
                >
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                    {p.code}
                  </span>
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
              <Link
                href="/projects"
                onClick={closeAll}
                className="block border-t mt-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                All projects
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="md:hidden p-2 text-slate-600 text-xl"
          aria-label="Toggle project menu"
          aria-expanded={isNavOpen}
        >
          {isNavOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav
        className={`${isNavOpen ? "block" : "hidden"} md:block pb-4`}
        aria-label="Project"
      >
        {project.archived && (
          <p className="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Archived
          </p>
        )}
        <Link
          href={base}
          onClick={closeAll}
          className={`${ITEM_BASE} ${pathname === base ? ITEM_ACTIVE : ITEM_IDLE}`}
        >
          Overview
        </Link>
        {SECTIONS.map((section) => {
          const href = `${base}/${section.slug}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={section.slug}
              href={href}
              onClick={closeAll}
              className={`${ITEM_BASE} ${isActive ? ITEM_ACTIVE : ITEM_IDLE}`}
            >
              {section.label}
            </Link>
          );
        })}

        {!project.archived && (
          <div className="px-4 pt-4">
            <StartRunButton suites={suites} />
          </div>
        )}
      </nav>
    </aside>
  );
}
