"use client";

import { useState } from "react";
import { updateResult } from "../actions";
import { STATUS_STYLES } from "@/lib/statusStyles";

function summarize(results) {
  const counts = {
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    blocked: results.filter((r) => r.status === "blocked").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    pending: results.filter((r) => r.status === "pending").length,
  };

  let label = "Passed";
  let style = "bg-green-100 text-green-700";

  if (counts.pending > 0) {
    label = "In Progress";
    style = "bg-blue-100 text-blue-700";
  } else if (counts.fail > 0 || counts.blocked > 0) {
    label = "Failed";
    style = "bg-red-100 text-red-700";
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
              <h2 className="font-semibold">{group.module.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {counts.pass}/{group.results.length} passed
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${style}`}
                >
                  {label}
                </span>
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
            <h2 className="font-semibold mb-2 border-b pb-1">No Module</h2>
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
        <h2 className="font-semibold">
          {result.test_case_code && (
            <span className="text-gray-400 font-normal mr-2">
              {result.test_case_code}
            </span>
          )}
          {result.title}
        </h2>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-600 space-y-2">
        <p>
          <span className="font-medium text-gray-800">Steps: </span>
          {result.steps_to_reproduce}
        </p>
        <p>
          <span className="font-medium text-gray-800">Expected: </span>
          {result.expected_result}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleStatusClick("pass")}
          disabled={isLocked}
          className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Pass
        </button>
        <button
          onClick={() => handleStatusClick("fail")}
          disabled={isLocked}
          className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Fail
        </button>
        <button
          onClick={() => handleStatusClick("blocked")}
          disabled={isLocked}
          className="px-3 py-1 rounded bg-yellow-600 text-white text-sm hover:bg-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Blocked
        </button>
        <button
          onClick={() => handleStatusClick("skipped")}
          disabled={isLocked}
          className="px-3 py-1 rounded bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Skipped
        </button>
      </div>

      {(status === "fail" || status === "blocked" || status === "skipped") && (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            disabled={isLocked}
            className="w-full border rounded p-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            onClick={handleSaveNotes}
            disabled={isLocked}
            className="mt-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Note
          </button>
        </div>
      )}
    </li>
  );
}
