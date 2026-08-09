"use client";

import { useState } from "react";
import { updateResult } from "../actions";
import { STATUS_STYLES } from "@/lib/statusStyles";

export default function ResultsList({ results, runId }) {
  return (
    <ul className="space-y-4">
      {results.map((result) => (
        <ResultItem key={result.id} result={result} runId={runId} />
      ))}
    </ul>
  );
}

function ResultItem({ result, runId }) {
  const [status, setStatus] = useState(result.status);
  const [notes, setNotes] = useState(result.notes || "");

  async function handleStatusClick(newStatus) {
    setStatus(newStatus);
    await updateResult({
      resultId: result.id,
      status: newStatus,
      notes,
      runId,
    });
  }

  async function handleSaveNotes() {
    await updateResult({ resultId: result.id, status, notes, runId });
  }

  return (
    <li className="border rounded-lg p-4">
      <div className="flex justify-between items-start gap-3">
        <h2 className="font-semibold">{result.title}</h2>
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
          className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
        >
          Pass
        </button>
        <button
          onClick={() => handleStatusClick("fail")}
          className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Fail
        </button>
        <button
          onClick={() => handleStatusClick("blocked")}
          className="px-3 py-1 rounded bg-yellow-600 text-white text-sm hover:bg-yellow-700"
        >
          Blocked
        </button>
        <button
          onClick={() => handleStatusClick("skipped")}
          className="px-3 py-1 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
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
            className="w-full border rounded p-2 text-sm"
          />
          <button
            onClick={handleSaveNotes}
            className="mt-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Save Note
          </button>
        </div>
      )}
    </li>
  );
}
