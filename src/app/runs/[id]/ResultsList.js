"use client";

import { useState } from "react";
import { updateResult } from "../actions";
import { STATUS_STYLES, RUN_STATUS_STYLES } from "@/lib/badgeStyles";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { formatStatusLabel } from '@/lib/formatLabel'

function summarize(results) {
  const counts = {
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    blocked: results.filter((r) => r.status === "blocked").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    pending: results.filter((r) => r.status === "pending").length,
  };

  let label = "Passed";
  let style = STATUS_STYLES.pass;

  if (counts.pending > 0) {
    label = "In Progress";
    style = RUN_STATUS_STYLES.in_progress;
  } else if (counts.fail > 0 || counts.blocked > 0) {
    label = "Failed";
    style = STATUS_STYLES.fail;
  }

  return { counts, label, style };
}

export default function ResultsList({
  moduleGroups,
  ungroupedResults,
  runId,
  isLocked,
}) {
  return (
    <div className="space-y-6">
      {moduleGroups.map((group) => {
        const { counts, label, style } = summarize(group.results);
        return (
          <div key={group.module.id}>
            <div className="flex justify-between items-center mb-2 border-b pb-1">
              <h2>{group.module.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {counts.pass}/{group.results.length} passed
                </span>
                <Badge className={style}>{label}</Badge>
              </div>
            </div>
            <ul className="space-y-4">
              {group.results.map((result) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  runId={runId}
                  isLocked={isLocked}
                />
              ))}
            </ul>
          </div>
        );
      })}

      {ungroupedResults.length > 0 && (
        <div>
          {moduleGroups.length > 0 && (
            <h2 className="mb-2 border-b pb-1">No Module</h2>
          )}
          <ul className="space-y-4">
            {ungroupedResults.map((result) => (
              <ResultItem
                key={result.id}
                result={result}
                runId={runId}
                isLocked={isLocked}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResultItem({ result, runId, isLocked }) {
  const [status, setStatus] = useState(result.status);
  const [notes, setNotes] = useState(result.notes || "");

  async function handleStatusClick(newStatus) {
    if (isLocked) return;
    setStatus(newStatus);
    await updateResult({
      resultId: result.id,
      status: newStatus,
      notes,
      runId,
    });
  }

  async function handleSaveNotes() {
    if (isLocked) return;
    await updateResult({ resultId: result.id, status, notes, runId });
  }

  return (
    <li className="border rounded-lg p-4">
      <div className="flex justify-between items-start gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          {result.test_case_code && (
            <span className="text-slate-400 font-normal mr-2">
              {result.test_case_code}
            </span>
          )}
          {result.title}
        </h2>
        <Badge className={STATUS_STYLES[status]}>{formatStatusLabel(status)}</Badge>
      </div>

      <div className="mt-3 text-sm text-slate-600 space-y-2">
        <p>
          <span className="font-medium text-slate-800">Steps: </span>
          {result.steps_to_reproduce}
        </p>
        <p>
          <span className="font-medium text-slate-800">Expected: </span>
          {result.expected_result}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          onClick={() => handleStatusClick("pass")}
          disabled={isLocked}
          variant="success"
          size="sm"
        >
          Pass
        </Button>
        <Button
          onClick={() => handleStatusClick("fail")}
          disabled={isLocked}
          variant="danger"
          size="sm"
        >
          Fail
        </Button>
        <Button
          onClick={() => handleStatusClick("blocked")}
          disabled={isLocked}
          variant="warning"
          size="sm"
        >
          Blocked
        </Button>
        <Button
          onClick={() => handleStatusClick("skipped")}
          disabled={isLocked}
          variant="skip"
          size="sm"
        >
          Skipped
        </Button>
      </div>

      {(status === "fail" || status === "blocked" || status === "skipped") && (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            disabled={isLocked}
            className="w-full border rounded p-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={isLocked}
            variant="primary"
            size="sm"
            className="mt-1"
          >
            Save Note
          </Button>
        </div>
      )}
    </li>
  );
}
