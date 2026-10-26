"use client";

import { useState } from "react";
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
import { formatId } from "@/lib/displayId";
import ConfirmButton from "@/components/ConfirmButton";
import Badge from "@/components/Badge";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";
import { formatStatusLabel } from "@/lib/formatLabel";

function SortableRow({
  linkedCase,
  parentId,
  parentLabel,
  parentField,
  linkField,
  remove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: linkedCase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const testCase = linkedCase.test_cases;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border rounded p-2 flex justify-between items-center bg-white"
    >
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-400 touch-none px-1"
        >
          ⠿
        </span>
        <span className="flex items-center gap-2">
          {testCase.seq_number && (
            <span className="text-slate-400 mr-2">
              {formatId("TC", testCase.seq_number)}
            </span>
          )}
          {testCase.title}
          <Badge className={PRIORITY_STYLES[testCase.priority]}>
            {formatStatusLabel(testCase.priority)}
          </Badge>
        </span>
      </div>
      <form action={remove}>
        <input type="hidden" name={linkField} value={linkedCase.id} />
        <input type="hidden" name={parentField} value={parentId} />
        <ConfirmButton
          message={`Remove this test case from the ${parentLabel}?`}
          variant="ghostDanger"
        >
          Remove
        </ConfirmButton>
      </form>
    </li>
  );
}

export default function SortableCaseList({
  linkedCases: initialLinkedCases,
  parentId,
  parentLabel,
  parentField,
  linkField,
  reorder,
  remove,
}) {
  const [linkedCases, setLinkedCases] = useState(initialLinkedCases);
  const [prevInitialLinkedCases, setPrevInitialLinkedCases] =
    useState(initialLinkedCases);

  if (initialLinkedCases !== prevInitialLinkedCases) {
    setPrevInitialLinkedCases(initialLinkedCases);
    setLinkedCases(initialLinkedCases);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = linkedCases.findIndex((lc) => lc.id === active.id);
    const newIndex = linkedCases.findIndex((lc) => lc.id === over.id);
    const reordered = arrayMove(linkedCases, oldIndex, newIndex);

    setLinkedCases(reordered);
    await reorder(
      parentId,
      reordered.map((lc) => lc.id),
    );
  }

  if (linkedCases.length === 0) {
    return <p className="text-slate-500 mb-6">None yet.</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={linkedCases.map((lc) => lc.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2 mb-6">
          {linkedCases.map((lc) => (
            <SortableRow
              key={lc.id}
              linkedCase={lc}
              parentId={parentId}
              parentLabel={parentLabel}
              parentField={parentField}
              linkField={linkField}
              remove={remove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
