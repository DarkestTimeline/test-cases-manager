"use client";

import SortableCaseList from "@/components/SortableCaseList";
import { reorderModuleCases, removeTestCaseFromModule } from "../actions";

export default function SortableModuleCases({ linkedCases, moduleId }) {
  return (
    <SortableCaseList
      linkedCases={linkedCases}
      parentId={moduleId}
      parentLabel="module"
      parentField="moduleId"
      linkField="moduleCaseId"
      reorder={reorderModuleCases}
      remove={removeTestCaseFromModule}
    />
  );
}
