"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { formatId } from "@/lib/displayId";
import { richTextToPlainText } from "@/lib/richText";
import { cleanSteps, normalizeSteps, stepsToText } from "@/lib/steps";

// Dialog for choosing a Step Block to add to a test case. It is rendered into
// document.body, outside the test case <form>: a search box inside a form would
// submit the whole form when Enter is pressed.
export default function BlockPicker({ blocks, projectCode, onPick, onClose }) {
  const [query, setQuery] = useState("");

  const entries = useMemo(
    () =>
      blocks.map((block) => {
        const steps = normalizeSteps(cleanSteps(block.steps));
        return {
          block,
          code: block.seq_number ? formatId("SB", block.seq_number) : "",
          count: steps.length,
          preview: steps[0] ? richTextToPlainText(steps[0].action) : "",
          haystack: `${block.seq_number ? formatId("SB", block.seq_number) : ""}\n${block.title}\n${stepsToText(steps)}`.toLowerCase(),
        };
      }),
    [blocks],
  );

  const needle = query.trim().toLowerCase();
  const shown = needle ? entries.filter((entry) => entry.haystack.includes(needle)) : entries;

  return createPortal(
    <Modal onClose={onClose} label="Add a step block" size="lg">
      <h2 className="mb-1 text-lg font-semibold">Add a step block</h2>
      <p className="mb-4 text-sm text-slate-600">
        The block&apos;s steps are shared: editing the block changes every test
        case that uses it.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-600">
          There are no step blocks in this project yet.{" "}
          <a
            href={`/projects/${projectCode}/step-blocks/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Create one
          </a>
          , then come back.
        </p>
      ) : (
        <>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (shown.length === 1) onPick(shown[0].block);
              }
            }}
            placeholder="Search by title, steps or code..."
            aria-label="Search step blocks"
            className="mb-3 w-full rounded border p-2 text-sm"
          />
          {shown.length === 0 ? (
            <p className="text-sm text-slate-500">No step blocks match your search.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {shown.map(({ block, code, count, preview }) => (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => onPick(block)}
                    className="w-full rounded border p-3 text-left transition-colors hover:bg-slate-100"
                  >
                    <span className="font-medium">
                      {code && <span className="mr-2 font-normal text-slate-400">{code}</span>}
                      {block.title}
                    </span>
                    {preview && (
                      <span className="mt-0.5 block text-sm text-slate-600 line-clamp-1">
                        {preview}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-slate-500">
                      {count} step{count === 1 ? "" : "s"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </Modal>,
    document.body,
  );
}
