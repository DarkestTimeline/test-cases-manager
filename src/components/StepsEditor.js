"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import RichTextEditor from "@/components/RichTextEditor";
import BlockPicker from "@/components/BlockPicker";
import StepsView from "@/components/StepsView";
import Button from "@/components/Button";
import { MoreIcon, PlusIcon, StepBlocksIcon } from "@/components/icons";
import { formatId } from "@/lib/displayId";
import {
  cleanSteps,
  emptyStep,
  expandSteps,
  isBlockRef,
  isStepEmpty,
  newBlockRef,
  newStepId,
  normalizeSteps,
  MAX_STEPS,
} from "@/lib/steps";

// Editor for a list of steps: one row per step with three rich text cells
// (action, data, expected result). The rows live in a hidden form field as
// JSON, so it works with plain <form action={...}> server actions. Read it on
// the server with readStepsField(formData, name) from "@/lib/steps".
//
// Test cases can also hold Step Blocks: a row that stands for a whole block of
// steps, shown collapsed. Pass `blocks` to turn that on (a Step Block's own
// form leaves it off: blocks cannot contain blocks).
//
// Props
//   name          hidden field name (default "steps")
//   defaultValue  stored steps (initial only)
//   errors        { rowIndex: message } from server-side validation
//   blocks        [{ id, seq_number, title, steps, archived_at }] the blocks
//                 that can be used here (active ones) plus any the steps
//                 already refer to; omit to switch blocks off
//   projectCode   used for the links to the blocks

const MENU_ITEM =
  "block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent";

const GRID =
  "md:grid md:grid-cols-[1.25rem_2.25rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] md:gap-x-3";

function StepMenu({ label, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setIsOpen(false);
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
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MoreIcon size={18} />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              disabled={item.disabled}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DragHandle({ n, attributes, listeners }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder step ${n}`}
      className="hidden cursor-grab touch-none pt-1.5 text-slate-400 hover:text-slate-600 md:block"
    >
      ⠿
    </button>
  );
}

function sortableStyle({ transform, transition, isDragging }) {
  return {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
}

function StepRow({ step, index, label, error, focusId, menuItems, onChange }) {
  const sortable = useSortable({ id: step.id });
  const n = label.start;
  const cellLabel = "text-xs font-medium text-slate-500 md:hidden";

  return (
    <li ref={sortable.setNodeRef} style={sortableStyle(sortable)} className="relative">
      <div className={`${GRID} items-start space-y-2 md:space-y-0`}>
        <DragHandle n={n} attributes={sortable.attributes} listeners={sortable.listeners} />
        <span className="pt-1.5 text-sm text-slate-500">
          <span className="md:hidden">Step </span>
          {n}
        </span>
        <div>
          <span className={cellLabel}>Step action</span>
          <RichTextEditor
            compact
            ariaLabel={`Step ${n} action`}
            placeholder="Step action"
            defaultValue={step.action}
            invalid={Boolean(error)}
            autoFocus={step.id === focusId}
            onChange={(doc) => onChange(step.id, "action", doc)}
          />
        </div>
        <div>
          <span className={cellLabel}>Data</span>
          <RichTextEditor
            compact
            ariaLabel={`Step ${n} data`}
            placeholder="Data"
            defaultValue={step.data}
            onChange={(doc) => onChange(step.id, "data", doc)}
          />
        </div>
        <div>
          <span className={cellLabel}>Expected result</span>
          <RichTextEditor
            compact
            ariaLabel={`Step ${n} expected result`}
            placeholder="Expected result"
            defaultValue={step.expected}
            onChange={(doc) => onChange(step.id, "expected", doc)}
          />
        </div>
        <StepMenu label={`More actions for step ${index + 1}`} items={menuItems} />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger md:ml-[3.5rem]">
          {error}
        </p>
      )}
    </li>
  );
}

function BlockRow({ row, index, label, block, projectCode, menuItems, onConvert }) {
  const sortable = useSortable({ id: row.id });
  const [isExpanded, setIsExpanded] = useState(false);
  const steps = block ? normalizeSteps(cleanSteps(block.steps)) : [];
  const range = label.end > label.start ? `${label.start}–${label.end}` : `${label.start}`;

  return (
    <li ref={sortable.setNodeRef} style={sortableStyle(sortable)} className="relative">
      <div className={`${GRID} items-start space-y-2 md:space-y-0`}>
        <DragHandle n={label.start} attributes={sortable.attributes} listeners={sortable.listeners} />
        <span className="pt-1.5 text-sm text-slate-500">
          <span className="md:hidden">Steps </span>
          {range}
        </span>
        <div
          data-testid="block-row"
          className="rounded border border-primary/30 bg-slate-50 p-2 md:col-span-3"
        >
          {block ? (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StepBlocksIcon size={16} />
                <a
                  href={`/projects/${projectCode}/step-blocks/${block.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 text-sm font-medium hover:underline"
                >
                  {block.seq_number && (
                    <span className="mr-1.5 font-normal text-slate-400">
                      {formatId("SB", block.seq_number)}
                    </span>
                  )}
                  {block.title}
                </a>
                {block.archived_at && (
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                    Archived
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {steps.length} step{steps.length === 1 ? "" : "s"}
                </span>
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    {isExpanded ? "Hide steps" : "Show steps"}
                  </button>
                  <button
                    type="button"
                    onClick={onConvert}
                    title="Replace this block with its steps, so you can edit them here. They stop following the block."
                    className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    Convert to steps
                  </button>
                </span>
              </div>
              {isExpanded && (
                <div className="mt-3 border-t pt-3">
                  <StepsView steps={steps} />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-danger">
              This step block is no longer available. Remove it from this test case.
            </p>
          )}
        </div>
        <StepMenu label={`More actions for step ${index + 1}`} items={menuItems} />
      </div>
    </li>
  );
}

export default function StepsEditor({
  name = "steps",
  defaultValue,
  errors = {},
  blocks,
  projectCode,
}) {
  const allowBlocks = Array.isArray(blocks);
  const [rows, setRows] = useState(() => {
    const initial = cleanSteps(defaultValue);
    if (initial.length) return initial;
    // A fixed id, not a random one: this runs on the server and again in the
    // browser, and the two renders must match.
    return [{ id: "first-step", action: null, data: null, expected: null }];
  });
  const [focusId, setFocusId] = useState(null);
  // Where the block picker will insert, or null while it is closed.
  const [pickerAt, setPickerAt] = useState(null);

  const blockMap = useMemo(
    () => Object.fromEntries((blocks ?? []).map((block) => [block.id, block])),
    [blocks],
  );
  const activeBlocks = useMemo(
    () => (blocks ?? []).filter((block) => !block.archived_at),
    [blocks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canAdd = rows.length < MAX_STEPS;

  // Step numbers count every step a block expands to: a 3-step block at the
  // start makes the next row step 4, the way the run will number them.
  const labels = useMemo(() => {
    let n = 0;
    return rows.map((row) => {
      const count = isBlockRef(row)
        ? Math.max(1, normalizeSteps(cleanSteps(blockMap[row.block_id]?.steps)).length)
        : 1;
      const label = { start: n + 1, end: n + count };
      n += count;
      return label;
    });
  }, [rows, blockMap]);

  function insertAt(position, step = emptyStep(), focus = true) {
    if (!canAdd) return;
    setRows((prev) => {
      // Adding a block to a form that is only one blank row: use that row.
      if (isBlockRef(step) && prev.length === 1 && isStepEmpty(prev[0])) return [step];
      return [...prev.slice(0, position), step, ...prev.slice(position)];
    });
    if (focus && !isBlockRef(step)) setFocusId(step.id);
  }

  function updateCell(id, cell, doc) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [cell]: doc } : row)));
  }

  function duplicate(index) {
    const copy = JSON.parse(JSON.stringify(rows[index]));
    insertAt(index + 1, { ...copy, id: newStepId() });
  }

  function remove(index) {
    // There is always at least one row to type in.
    setRows((prev) => (prev.length === 1 ? [emptyStep()] : prev.filter((_, i) => i !== index)));
  }

  function convertToSteps(index) {
    const own = expandSteps([rows[index]], blockMap);
    setRows((prev) => [...prev.slice(0, index), ...own, ...prev.slice(index + 1)]);
  }

  function pickBlock(block) {
    const position = pickerAt ?? rows.length;
    setPickerAt(null);
    insertAt(position, newBlockRef(block.id), false);
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const from = prev.findIndex((row) => row.id === active.id);
      const to = prev.findIndex((row) => row.id === over.id);
      return arrayMove(prev, from, to);
    });
  }

  function menuItemsFor(row, index) {
    const items = [
      { label: "Insert step above", disabled: !canAdd, onClick: () => insertAt(index) },
      { label: "Insert step below", disabled: !canAdd, onClick: () => insertAt(index + 1) },
    ];
    if (allowBlocks) {
      items.push(
        { label: "Insert step block above", disabled: !canAdd, onClick: () => setPickerAt(index) },
        { label: "Insert step block below", disabled: !canAdd, onClick: () => setPickerAt(index + 1) },
      );
    }
    if (isBlockRef(row)) {
      if (blockMap[row.block_id]) {
        items.push({ label: "Convert to steps", onClick: () => convertToSteps(index) });
      }
      items.push({ label: "Remove block", onClick: () => remove(index) });
    } else {
      items.push(
        { label: "Duplicate", disabled: !canAdd, onClick: () => duplicate(index) },
        { label: "Delete", onClick: () => remove(index) },
      );
    }
    return items;
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />

      <div className={`${GRID} mb-2 hidden text-xs font-medium text-slate-500`}>
        <span className="col-start-3">Step action</span>
        <span>Data</span>
        <span>Expected result</span>
      </div>

      <DndContext
        id="steps-editor"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-9 md:space-y-4">
            {rows.map((row, index) =>
              isBlockRef(row) ? (
                <BlockRow
                  key={row.id}
                  row={row}
                  index={index}
                  label={labels[index]}
                  block={blockMap[row.block_id]}
                  projectCode={projectCode}
                  menuItems={menuItemsFor(row, index)}
                  onConvert={() => convertToSteps(index)}
                />
              ) : (
                <StepRow
                  key={row.id}
                  step={row}
                  index={index}
                  label={labels[index]}
                  error={errors[index]}
                  focusId={focusId}
                  menuItems={menuItemsFor(row, index)}
                  onChange={updateCell}
                />
              ),
            )}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canAdd}
          onClick={() => insertAt(rows.length)}
        >
          <span className="inline-flex items-center gap-1">
            <PlusIcon size={14} /> New step
          </span>
        </Button>
        {allowBlocks && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canAdd}
            onClick={() => setPickerAt(rows.length)}
          >
            <span className="inline-flex items-center gap-1">
              <StepBlocksIcon size={14} /> Add step block
            </span>
          </Button>
        )}
        {!canAdd && (
          <span className="text-xs text-slate-500">
            A test case can have at most {MAX_STEPS} steps.
          </span>
        )}
      </div>

      {pickerAt !== null && (
        <BlockPicker
          blocks={activeBlocks}
          projectCode={projectCode}
          onPick={pickBlock}
          onClose={() => setPickerAt(null)}
        />
      )}
    </div>
  );
}
