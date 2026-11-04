"use client";

import { useState } from "react";
import { startRun, getProjectSuites } from "@/app/projects/[code]/runs/actions";
import Button from "./Button";
import Modal from "./Modal";
import FormSubmitButton from "./FormSubmitButton";
import Field from "@/components/Field";
import { PlayIcon } from "./icons";

// Sidebar action. Suites are loaded when the dialog opens, so the list is
// always current and the sidebar needs no data from the page.
export default function StartRunButton({
  projectCode,
  collapsed = false,
  suiteId,
  variant = "sidebar",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suites, setSuites] = useState(null); // null while loading
  const [loadError, setLoadError] = useState(null);

  async function open() {
    setIsOpen(true);
    setSuites(null);
    setLoadError(null);
    const result = await getProjectSuites(projectCode);
    if (result.error) setLoadError(result.error);
    else setSuites(result.suites);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      {variant === "inline" ? (
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <PlayIcon size={12} />
          Run
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          title={collapsed ? "Start run" : undefined}
          className={`flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover ${
            collapsed ? "md:px-0" : ""
          }`}
        >
          <PlayIcon size={14} />
          <span className={collapsed ? "md:hidden" : ""}>Start run</span>
        </button>
      )}

      {isOpen && (
        <Modal label="Start a run" onClose={close}>
          <h2 className="mb-4">Start a Run</h2>

          {loadError ? (
            <p role="alert" className="text-danger text-sm">
              {loadError}
            </p>
          ) : suites === null ? (
            <p className="text-slate-400 text-sm">Loading suites…</p>
          ) : suites.length === 0 ? (
            <p className="text-slate-500">
              No suites exist in this project yet — create one first.
            </p>
          ) : (
            <form action={startRun} className="space-y-4">
              <Field label="Suite">
                <select
                  name="suiteId"
                  required
                  defaultValue={suiteId}
                  className="w-full border rounded p-2"
                >
                  {suites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="OS">
                <input
                  type="text"
                  name="os"
                  placeholder="e.g. macOS 15, Windows 11"
                  className="w-full border rounded p-2"
                />
              </Field>
              <Field label="Build / Version">
                <input
                  type="text"
                  name="build_version"
                  placeholder="e.g. v2.4.1"
                  className="w-full border rounded p-2"
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={close}
                >
                  Cancel
                </Button>
                <FormSubmitButton size="md" pendingLabel="Starting...">
                  Start Run
                </FormSubmitButton>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
