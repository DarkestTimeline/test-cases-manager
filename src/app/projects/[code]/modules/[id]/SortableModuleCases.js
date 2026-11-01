"use client";

import SortableCaseList from "@/components/SortableCaseList";
import { reorderModuleCases, removeTestCaseFromModule } from "../actions";

export default function SortableModuleCases({
  linkedCases,
  moduleId,
  casePrefix,
}) {
  return (
    <SortableCaseList
      linkedCases={linkedCases}
      parentId={moduleId}
      casePrefix={casePrefix}
      parentLabel="module"
      parentField="moduleId"
      linkField="moduleCaseId"
      reorder={reorderModuleCases}
      remove={removeTestCaseFromModule}
    />
  );
}
