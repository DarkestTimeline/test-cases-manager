"use client";

import { useState, useEffect, useCallback } from "react";
import { updateResult } from "../actions";
import { STATUS_STYLES, RUN_STATUS_STYLES } from "@/lib/badgeStyles";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { formatStatusLabel } from "@/lib/formatLabel";

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

function ModuleSection({ title, results, runId, isLocked }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { counts, label, style } = summarize(results);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center mb-2 border-b pb-1 text-left"
      >
        <h2 className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {isExpanded ? "▼" : "▶"}
          </span>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {counts.pass}/{results.length} passed
          </span>
          <Badge className={style}>{label}</Badge>
        </div>
      </button>
      {isExpanded && (
        <ul className="space-y-4">
          {results.map((result) => (
            <ResultItem
              key={result.id}
              result={result}
              runId={runId}
              isLocked={isLocked}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ResultsList({
  moduleGroups,
  ungroupedResults,
  runId,
  isLocked,
}) {
  return (
    <div className="space-y-6">
      {!isLocked && (
        <p className="text-xs text-slate-400">
          Tip: hover a test case and press{" "}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-slate-600">
            P
          </kbd>{" "}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-slate-600">
            F
          </kbd>{" "}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-slate-600">
            B
          </kbd>{" "}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-slate-600">
            S
          </kbd>{" "}
          to mark it quickly.
        </p>
      )}

      {moduleGroups.map((group) => (
        <ModuleSection
          key={group.module.id}
          title={group.module.name}
          results={group.results}
          runId={runId}
          isLocked={isLocked}
        />
      ))}

      {ungroupedResults.length > 0 && (
        <ModuleSection
          title="No Module"
          results={ungroupedResults}
          runId={runId}
          isLocked={isLocked}
        />
      )}
    </div>
  );
}

const SHORTCUT_MAP = { p: "pass", f: "fail", b: "blocked", s: "skipped" };

const RESOLVED_ACCENT = {
  pass: "border-l-4 border-l-success bg-success/5",
  fail: "border-l-4 border-l-danger bg-danger/5",
  blocked: "border-l-4 border-l-warning bg-warning/5",
  skipped: "border-l-4 border-l-skip bg-skip/5",
};

function ResultItem({ result, runId, isLocked }) {
  const [status, setStatus] = useState(result.status);
  const [notes, setNotes] = useState(result.notes || "");
  const [isHovered, setIsHovered] = useState(false);

  const handleStatusClick = useCallback(
    async (newStatus) => {
      if (isLocked) return;
      setStatus(newStatus);
      await updateResult({
        resultId: result.id,
        status: newStatus,
        notes,
        runId,
      });
    },
    [isLocked, notes, result.id, runId],
  );

  async function handleSaveNotes() {
    if (isLocked) return;
    await updateResult({ resultId: result.id, status, notes, runId });
  }

  useEffect(() => {
    if (!isHovered || isLocked) return;

    function handleKeyDown(e) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const newStatus = SHORTCUT_MAP[e.key.toLowerCase()];
      if (newStatus) {
        handleStatusClick(newStatus);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, isLocked, handleStatusClick]);

  return (
    <li
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`border rounded-lg p-4 transition-shadow transition-colors ${RESOLVED_ACCENT[status] || ""} ${isHovered && !isLocked ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex justify-between items-start gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          {result.test_case_code && (
            <span className="text-slate-400 font-normal mr-2">
              {result.test_case_code}
            </span>
          )}
          {result.title}
        </h2>
        <Badge className={STATUS_STYLES[status]}>
          {formatStatusLabel(status)}
        </Badge>
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() => handleStatusClick("pass")}
          disabled={isLocked}
          variant="success"
          size="sm"
          className={
            status === "pass" ? "ring-2 ring-offset-1 ring-success" : ""
          }
        >
          Pass
        </Button>
        <Button
          onClick={() => handleStatusClick("fail")}
          disabled={isLocked}
          variant="danger"
          size="sm"
          className={
            status === "fail" ? "ring-2 ring-offset-1 ring-danger" : ""
          }
        >
          Fail
        </Button>
        <Button
          onClick={() => handleStatusClick("blocked")}
          disabled={isLocked}
          variant="warning"
          size="sm"
          className={
            status === "blocked" ? "ring-2 ring-offset-1 ring-warning" : ""
          }
        >
          Blocked
        </Button>
        <Button
          onClick={() => handleStatusClick("skipped")}
          disabled={isLocked}
          variant="skip"
          size="sm"
          className={
            status === "skipped" ? "ring-2 ring-offset-1 ring-skip" : ""
          }
        >
          Skipped
        </Button>
      </div>

      {(status === "fail" || status === "blocked" || status === "skipped") && (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Add a note..."
            rows={2}
            disabled={isLocked}
            className="w-full border rounded p-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={isLocked}
            variant="primary"
            size="md"
            className="mt-1"
          >
            Save Note
          </Button>
        </div>
      )}
    </li>
  );
}
