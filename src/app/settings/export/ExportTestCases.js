"use client";

import { useState } from "react";
import Papa from "papaparse";
import Button from "@/components/Button";
import Field from "@/components/Field";
import { downloadFile } from "@/lib/downloadFile";
import { exportTestCases } from "@/app/test-cases/actions";

const MESSAGE_STYLES = {
  success: "text-success",
  error: "text-danger",
  info: "text-slate-500",
};

export default function ExportTestCases({ suites, modules }) {
  const [scope, setScope] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setIsExporting(true);
    setMessage(null);
    try {
      const result = await exportTestCases(scope);

      if (result.error) {
        setMessage({ type: "error", text: `Export failed: ${result.error}` });
        return;
      }

      if (result.rows.length === 0) {
        setMessage({
          type: "info",
          text: "There are no active test cases in this selection, so nothing was downloaded.",
        });
        return;
      }

      downloadFile("test-cases-export.csv", Papa.unparse(result.rows));
      const count = result.rows.length;
      setMessage({
        type: "success",
        text: `Exported ${count} test case${count === 1 ? "" : "s"}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Export failed. Check your connection and try again.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-4">Export Test Cases</h2>
      <p className="text-slate-600 mb-4">
        Download test cases as a CSV file — useful as a backup, or to bring into
        another tool.
      </p>

      <div className="mb-4">
        <Field label="What to export">
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setMessage(null);
            }}
            className="border rounded p-2 text-sm"
          >
            <option value="all">All Test Cases</option>
            <optgroup label="Suites">
              {suites.map((s) => (
                <option key={`suite-${s.id}`} value={`suite:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Modules">
              {modules.map((m) => (
                <option key={`module-${m.id}`} value={`module:${m.id}`}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          </select>
        </Field>
      </div>

      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? "Exporting..." : "Export Test Cases"}
      </Button>

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`text-sm mt-3 ${MESSAGE_STYLES[message.type]}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
