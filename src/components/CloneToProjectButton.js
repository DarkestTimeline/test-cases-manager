"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import Modal from "./Modal";
import Field from "./Field";
import { previewClone, cloneToProject } from "@/app/projects/cloneActions";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function moduleDetail(modules, reused, targetCode) {
  if (modules === 0) return null;
  const created = modules - reused;
  const parts = [];
  if (created > 0) parts.push(`${created} new`);
  if (reused > 0) parts.push(`${reused} already in ${targetCode}, so reused`);
  return `Modules: ${parts.join(", ")}.`;
}

function describe(kind, preview, targetCode) {
  if (kind === "step_block") {
    return [
      `Copies this step block with its ${plural(preview.steps, "step")}.`,
      "The copy is independent: later changes to the original do not change it, and test cases that use the original keep using it.",
    ];
  }

  const { cases, modules, modules_reused: reused } = preview;
  const lines = [];

  if (kind === "test_case") {
    lines.push(
      modules > 0
        ? `Copies this test case and links it to ${plural(modules, "module")}.`
        : "Copies this test case.",
    );
    lines.push(moduleDetail(modules, reused, targetCode));
  } else if (kind === "module") {
    lines.push(
      `Copies this module with its ${plural(cases, "active test case")}.`,
    );
    lines.push(
      reused > 0
        ? `${targetCode} already has a module with this name, so the copied test cases are added to it.`
        : "A new module is created.",
    );
  } else {
    lines.push(
      `Copies this suite with ${plural(cases, "active test case")}${
        modules > 0 ? ` and ${plural(modules, "module")}` : ""
      }.`,
    );
    lines.push(moduleDetail(modules, reused, targetCode));
  }

  lines.push("The original is not changed, and run history is not copied.");
  return lines.filter(Boolean);
}

// The dialog itself. Mount it to open it; it calls onClose to be unmounted.
export function CloneToProjectDialog({ kind, id, projects, onClose }) {
  const router = useRouter();
  const [target, setTarget] = useState(projects[0]?.code ?? "");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const requestRef = useRef(0);

  async function loadPreview(code) {
    const ticket = ++requestRef.current;
    setPreview(null);
    setError(null);
    const result = await previewClone(kind, id, code);
    if (ticket !== requestRef.current) return;
    if (result.error) setError(result.error);
    else setPreview(result.preview);
  }

  useEffect(() => {
    loadPreview(projects[0]?.code ?? "");
    return () => {
      requestRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTargetChange(event) {
    setTarget(event.target.value);
    loadPreview(event.target.value);
  }

  function handleClone() {
    setError(null);
    startTransition(async () => {
      const result = await cloneToProject(kind, id, target);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(result.path);
    });
  }

  return (
    <Modal label="Clone to project" onClose={onClose}>
      <h2 className="mb-4">Clone to project</h2>

      <Field label="Target project">
        <select
          value={target}
          onChange={handleTargetChange}
          disabled={isPending}
          className="w-full border rounded p-2"
        >
          {projects.map((project) => (
            <option key={project.code} value={project.code}>
              {project.code} — {project.name}
            </option>
          ))}
        </select>
      </Field>

      <div
        className="mt-4 min-h-20 space-y-1 text-sm text-slate-700"
        aria-live="polite"
      >
        {!preview && !error && (
          <p className="text-slate-400">Checking what will be copied…</p>
        )}
        {preview &&
          describe(kind, preview, target).map((line) => (
            <p key={line}>{line}</p>
          ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="md"
          onClick={handleClone}
          disabled={!preview || isPending}
        >
          {isPending ? "Cloning…" : "Clone"}
        </Button>
      </div>
    </Modal>
  );
}

export default function CloneToProjectButton({
  kind,
  id,
  projects,
  label = "Clone to project…",
  variant = "secondary",
  size = "sm",
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (projects.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </Button>
      {isOpen && (
        <CloneToProjectDialog
          kind={kind}
          id={id}
          projects={projects}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
