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
import { reorderModuleCases, removeTestCaseFromModule } from "../actions";
import { formatId } from "@/lib/displayId";
import ConfirmButton from "@/components/ConfirmButton";

function SortableRow({ linkedCase, moduleId }) {
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
        <span>
          {linkedCase.test_cases.seq_number && (
            <span className="text-slate-400 mr-2">
              {formatId("TC", linkedCase.test_cases.seq_number)}
            </span>
          )}
          {linkedCase.test_cases.title}
        </span>
      </div>
      <form action={removeTestCaseFromModule}>
        <input type="hidden" name="moduleCaseId" value={linkedCase.id} />
        <input type="hidden" name="moduleId" value={moduleId} />
        <ConfirmButton
          message="Remove this test case from the suite?"
          variant="ghostDanger"
        >
          Remove
        </ConfirmButton>
      </form>
    </li>
  );
}

export default function SortableModuleCases({
  linkedCases: initialLinkedCases,
  moduleId,
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
    await reorderModuleCases(
      moduleId,
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
            <SortableRow key={lc.id} linkedCase={lc} moduleId={moduleId} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
