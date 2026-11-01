"use client";

import SortableCaseList from "@/components/SortableCaseList";
import { reorderSuiteCases, removeTestCaseFromSuite } from "../actions";

export default function SortableSuiteCases({
  linkedCases,
  suiteId,
  casePrefix,
}) {
  return (
    <SortableCaseList
      linkedCases={linkedCases}
      parentId={suiteId}
      casePrefix={casePrefix}
      parentLabel="suite"
      parentField="suiteId"
      linkField="suiteCaseId"
      reorder={reorderSuiteCases}
      remove={removeTestCaseFromSuite}
    />
  );
}
