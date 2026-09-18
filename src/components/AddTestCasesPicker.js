"use client";

import { useState } from "react";
import Badge from "./Badge";
import Button from "./Button";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";

function Group({ groupKey, label, cases }) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleSelectAll() {
    const container = document.querySelector(`[data-group="${groupKey}"]`);
    if (!container) return;
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = true;
    });
  }

  return (
    <div data-group={groupKey} className="border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-slate-50">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          <span>{isExpanded ? "▼" : "▶"}</span>
          {label} ({cases.length})
        </button>
        <Button type="button" onClick={handleSelectAll} variant="ghost">
          Select All
        </Button>
      </div>
      {isExpanded && (
        <div className="p-2 space-y-1 border-t">
          {cases.map((tc) => (
            <label
              key={tc.id}
              className="flex items-center justify-between gap-2 border rounded p-2 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <input type="checkbox" name="testCaseIds" value={tc.id} />
                {tc.title}
              </span>
              <Badge className={PRIORITY_STYLES[tc.priority]}>
                {tc.priority}
              </Badge>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddTestCasesPicker({ moduleGroups, ungrouped }) {
  return (
    <div className="space-y-2">
      {moduleGroups.map((group) => (
        <Group
          key={group.module.id}
          groupKey={group.module.id}
          label={group.module.name}
          cases={group.cases}
        />
      ))}
      {ungrouped.length > 0 && (
        <Group groupKey="ungrouped" label="No Module" cases={ungrouped} />
      )}
    </div>
  );
}
