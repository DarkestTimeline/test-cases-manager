"use client";

import SortableCaseList from "@/components/SortableCaseList";
import { reorderSuiteCases, removeTestCaseFromSuite } from "../actions";

export default function SortableSuiteCases({ linkedCases, suiteId }) {
  return (
    <SortableCaseList
      linkedCases={linkedCases}
      parentId={suiteId}
      parentLabel="suite"
      parentField="suiteId"
      linkField="suiteCaseId"
      reorder={reorderSuiteCases}
      remove={removeTestCaseFromSuite}
    />
  );
}
