"use client";

import { useEffect, useRef, useState } from "react";
import { CloneToProjectDialog } from "./CloneToProjectButton";
import { MoreIcon } from "./icons";

const ITEM =
  "block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100";

// "..." menu for list rows: clone to another project, archive or restore.
export default function RowMenu({
  kind,
  id,
  projects,
  archived,
  archiveAction,
  restoreAction,
  idField,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoreIcon size={18} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg"
        >
          {projects.length > 0 && (
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={() => {
                setIsOpen(false);
                setIsCloning(true);
              }}
            >
              Clone to project…
            </button>
          )}
          {/* The menu closes on submit, not on click: closing on click removes
              this form from the page before the browser can submit it, and
              nothing is sent. */}
          <form
            action={archived ? restoreAction : archiveAction}
            onSubmit={() => setIsOpen(false)}
          >
            <input type="hidden" name={idField} value={id} />
            <button type="submit" role="menuitem" className={ITEM}>
              {archived ? "Restore" : "Archive"}
            </button>
          </form>
        </div>
      )}

      {isCloning && (
        <CloneToProjectDialog
          kind={kind}
          id={id}
          projects={projects}
          onClose={() => setIsCloning(false)}
        />
      )}
    </div>
  );
}
