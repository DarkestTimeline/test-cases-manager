// Structured test case steps. Pure JavaScript (no React), so it runs in server
// actions, server components and the browser alike.
//
// A test case stores its steps as a jsonb array. Each item is either
//   a plain step:  { id, action, data, expected }
//                  (action / data / expected are rich text docs, see ./richText, or null)
//   a reference to a Step Block:  { id, type: "block", block_id }
// A reference is live: the block's current steps are used wherever the case is
// shown or run. When a run starts, references are expanded into plain steps
// (each marked with the block it came from) and copied into run_results.steps.

import {
  isRichTextEmpty,
  plainTextToDoc,
  richTextToPlainText,
  sanitizeRichText,
} from "./richText";

export const MAX_STEPS = 200;
export const MAX_STEPS_PAYLOAD = 500000; // characters of JSON from the form
export const ACTION_REQUIRED_MESSAGE = "Specify what action should be performed.";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const CELLS = ["action", "data", "expected"];
// Used when a CSV has an expected result but no steps at all.
const PLACEHOLDER_ACTION = "Check the expected result";
// Shown in place of a referenced block that cannot be found.
const UNAVAILABLE_BLOCK_ACTION = "This step block is no longer available";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function newStepId() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyStep() {
  return { id: newStepId(), action: null, data: null, expected: null };
}

export function isBlockRef(step) {
  return step?.type === "block";
}

export function newBlockRef(blockId) {
  return { id: newStepId(), type: "block", block_id: blockId };
}

// Where an expanded step came from: { id, seq_number, title }, or null.
function cleanBlockMeta(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.id !== "string" || !UUID_PATTERN.test(value.id)) return null;
  const seq = Number.isInteger(value.seq_number) && value.seq_number > 0 ? value.seq_number : null;
  const title = typeof value.title === "string" ? value.title.slice(0, 200) : "";
  return { id: value.id, seq_number: seq, title };
}

// A cell is a clean rich text doc, or null when it has no text.
function cleanCell(value) {
  if (value == null) return null;
  const doc = sanitizeRichText(value);
  return doc && !isRichTextEmpty(doc) ? doc : null;
}

// Cleans untrusted steps (a parsed array or a JSON string) into
// [{ id, action, data, expected }]. Empty rows are kept, so row numbers keep
// matching what the person sees; use normalizeSteps() to drop them.
export function cleanSteps(value) {
  let list = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const uniqueId = (candidate) => {
    let id = typeof candidate === "string" && ID_PATTERN.test(candidate) ? candidate : null;
    if (!id || seen.has(id)) id = newStepId();
    seen.add(id);
    return id;
  };

  return list
    .slice(0, MAX_STEPS)
    .map((item) => {
      if (item?.type === "block") {
        // A reference needs a real block id; anything else is dropped.
        if (typeof item.block_id !== "string" || !UUID_PATTERN.test(item.block_id)) return null;
        return { id: uniqueId(item.id), type: "block", block_id: item.block_id.toLowerCase() };
      }
      const step = {
        id: uniqueId(item?.id),
        action: cleanCell(item?.action),
        data: cleanCell(item?.data),
        expected: cleanCell(item?.expected),
      };
      const fromBlock = cleanBlockMeta(item?.from_block);
      if (fromBlock) step.from_block = fromBlock;
      return step;
    })
    .filter(Boolean);
}

export function isStepEmpty(step) {
  if (isBlockRef(step)) return false;
  return CELLS.every((cell) => !step[cell]);
}

// Drops plain rows that have nothing in them (references are always kept).
export function normalizeSteps(steps) {
  return steps.filter((step) => !isStepEmpty(step));
}

// { rowIndex: message } for rows without an action. Indexes refer to the list
// as submitted. A list where every row is blank just means "no steps" (the
// blank rows are dropped when saving), so that is not an error.
export function validateSteps(steps) {
  const errors = {};
  if (steps.every(isStepEmpty)) return errors;
  steps.forEach((step, index) => {
    if (isBlockRef(step)) return;
    if (!step.action) errors[index] = ACTION_REQUIRED_MESSAGE;
  });
  return errors;
}

// Reads the steps field from submitted form data.
// Returns { steps, error }; error is a message when the field is unusable.
export function readStepsField(formData, name = "steps") {
  const raw = formData.get(name);
  if (typeof raw !== "string" || !raw.trim()) return { steps: [], error: null };
  if (raw.length > MAX_STEPS_PAYLOAD) {
    return { steps: [], error: "The steps contain too much content. Shorten them and try again." };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { steps: [], error: "The steps could not be read. Reload the page and try again." };
  }
  if (Array.isArray(parsed) && parsed.length > MAX_STEPS) {
    return { steps: [], error: `A test case can have at most ${MAX_STEPS} steps.` };
  }
  return { steps: cleanSteps(parsed), error: null };
}

function cellText(step, cell) {
  return step[cell] ? richTextToPlainText(step[cell]) : "";
}

// A short summary for lists: "3 steps", "2 steps · 1 step block", or "" if empty.
export function describeSteps(value) {
  const list = normalizeSteps(cleanSteps(value));
  const blocks = list.filter(isBlockRef).length;
  const steps = list.length - blocks;
  const parts = [];
  if (steps > 0) parts.push(`${steps} step${steps === 1 ? "" : "s"}`);
  if (blocks > 0) parts.push(`${blocks} step block${blocks === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

// The ids of the Step Blocks a list of steps refers to.
export function blockIdsIn(steps) {
  return [...new Set(steps.filter(isBlockRef).map((step) => step.block_id))];
}

// Replaces each block reference by the block's own steps, so the result has
// plain steps only. blocksById: { [id]: { id, seq_number, title, steps } }.
// With withMeta, every step that came from a block is marked with it (run
// snapshots show "from SB-01 ..."). A block that cannot be found becomes one
// visible placeholder step instead of silently disappearing.
export function expandSteps(steps, blocksById = {}, { withMeta = false } = {}) {
  const out = [];
  for (const step of steps) {
    if (!isBlockRef(step)) {
      out.push(step);
      continue;
    }
    const block = blocksById[step.block_id];
    if (!block) {
      out.push({
        id: newStepId(),
        action: plainTextToDoc(UNAVAILABLE_BLOCK_ACTION),
        data: null,
        expected: null,
      });
      continue;
    }
    const meta = withMeta
      ? cleanBlockMeta({ id: block.id, seq_number: block.seq_number, title: block.title })
      : null;
    for (const inner of normalizeSteps(cleanSteps(block.steps))) {
      // Fresh ids: the same block can appear more than once in one case.
      const copy = { ...inner, id: newStepId() };
      delete copy.from_block;
      if (meta) copy.from_block = meta;
      out.push(copy);
    }
  }
  return out;
}

// One searchable string, stored in test_cases.steps_text. A block reference
// contributes the block's title and the text of its steps.
export function stepsToText(steps, blocksById = {}) {
  const parts = [];
  for (const step of steps) {
    if (isBlockRef(step)) {
      const block = blocksById[step.block_id];
      if (block) {
        if (block.title) parts.push(block.title);
        const text = stepsToText(normalizeSteps(cleanSteps(block.steps)));
        if (text) parts.push(text);
      }
      continue;
    }
    for (const cell of CELLS) {
      const text = cellText(step, cell);
      if (text) parts.push(text);
    }
  }
  return parts.join("\n").slice(0, 50000);
}

// Readable plain text, used in the CSV "steps" column. Blocks are expanded, so
// the numbering counts every step:
//   1. Open the app
//      Data: user@example.com
//      Expected: The login page is shown
export function stepsToReadableText(steps, blocksById = {}) {
  return expandSteps(steps, blocksById)
    .map((step, index) => {
      const indent = "   ";
      const lines = [`${index + 1}. ${cellText(step, "action").replace(/\n/g, "\n" + indent)}`];
      const data = cellText(step, "data");
      const expected = cellText(step, "expected");
      if (data) lines.push(`${indent}Data: ${data.replace(/\n/g, "\n" + indent)}`);
      if (expected) lines.push(`${indent}Expected: ${expected.replace(/\n/g, "\n" + indent)}`);
      return lines.join("\n");
    })
    .join("\n");
}

const LIST_MARKER = /^\s*(?:\d+[.)]|[-*\u2022])\s+/;

// Builds steps from one CSV row. Uses the full-fidelity steps_json column when
// it is there; otherwise reads plain text, one step per line (steps, or the
// older steps_to_reproduce), and puts expected_result on the last step.
export function csvRowToSteps(row) {
  const json = typeof row?.steps_json === "string" ? row.steps_json.trim() : "";
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return normalizeSteps(cleanSteps(parsed));
    } catch {
      // fall through to the plain text columns
    }
  }

  const text = String(row?.steps ?? row?.steps_to_reproduce ?? "");
  const expectedText = String(row?.expected_result ?? "").trim();

  const steps = text
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter(Boolean)
    .slice(0, MAX_STEPS)
    .map((line) => ({
      id: newStepId(),
      action: plainTextToDoc(line),
      data: null,
      expected: null,
    }));

  if (expectedText) {
    const expected = plainTextToDoc(expectedText);
    if (steps.length) {
      steps[steps.length - 1].expected = expected;
    } else {
      steps.push({
        id: newStepId(),
        action: plainTextToDoc(PLACEHOLDER_ACTION),
        data: null,
        expected,
      });
    }
  }
  return steps;
}
