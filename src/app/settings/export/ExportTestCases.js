"use client";

import { useState } from "react";
import Papa from "papaparse";
import Button from "@/components/Button";
import { downloadFile } from "@/lib/downloadFile";
import { exportTestCases } from "@/app/test-cases/actions";

export default function ExportTestCases({ suites, modules }) {
  const [scope, setScope] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const testCases = await exportTestCases(scope);
      const csv = Papa.unparse(testCases);
      downloadFile("test-cases-export.csv", csv);
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
        <label className="block text-sm font-medium mb-1">Export</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
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
      </div>

      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? "Exporting..." : "Export Test Cases"}
      </Button>
    </div>
  );
}
