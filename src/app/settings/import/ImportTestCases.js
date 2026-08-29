"use client";

import { useState } from "react";
import Papa from "papaparse";
import Button from "@/components/Button";
import { downloadFile } from "@/lib/downloadFile";
import { validateRow } from "@/lib/testCaseValidation";
import { importTestCases } from "@/app/test-cases/actions";

const EXPECTED_COLUMNS = [
  "title",
  "preconditions",
  "steps_to_reproduce",
  "expected_result",
];

export default function ImportTestCases() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setImportResult(null);
    setRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const missingColumns = EXPECTED_COLUMNS.filter(
          (col) => !results.meta.fields.includes(col),
        );
        if (missingColumns.length > 0) {
          setError(`Missing expected column(s): ${missingColumns.join(", ")}`);
          return;
        }
        setRows(results.data);
      },
      error: () => {
        setError("Could not parse this file. Make sure it is a valid CSV.");
      },
    });
  }

  function handleDownloadTemplate() {
    downloadFile("test-cases-template.csv", `${EXPECTED_COLUMNS.join(",")}\n`);
  }

  async function handleImport() {
    setIsImporting(true);
    setError("");
    try {
      const result = await importTestCases(rows);
      setImportResult(result);
      setRows([]);
      setFileName("");
      setFileInputKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  }

  const rowErrors = rows.map((row) => validateRow(row));
  const errorCount = rowErrors.filter((errs) => errs.length > 0).length;
  const hasErrors = errorCount > 0;

  return (
    <div>
      <p className="text-slate-600 mb-2">
        Upload a CSV with columns:{" "}
        <code className="bg-slate-100 px-1 rounded">title</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">preconditions</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">steps_to_reproduce</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">expected_result</code>
      </p>

      <button
        onClick={handleDownloadTemplate}
        className="text-sm text-primary hover:underline mb-4"
      >
        Download a blank template
      </button>

      <div className="mb-6">
        <input
          key={fileInputKey}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="text-sm"
        />
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {importResult && (
        <p className="text-success text-sm mb-4 font-medium">
          Imported {importResult.importedCount} test case
          {importResult.importedCount !== 1 ? "s" : ""} successfully!
        </p>
      )}

      {rows.length > 0 && (
        <>
          <p className="text-sm mb-2">
            Found {rows.length} row{rows.length !== 1 ? "s" : ""} in {fileName}
            {hasErrors && (
              <span className="text-danger font-medium">
                {" "}
                — {errorCount} row{errorCount !== 1 ? "s" : ""} need attention
              </span>
            )}
          </p>
          <div className="overflow-x-auto border rounded mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Preconditions</th>
                  <th className="text-left p-2">Steps</th>
                  <th className="text-left p-2">Expected Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      rowErrors[i].length > 0
                        ? "bg-red-50 border-t border-red-200"
                        : "border-t"
                    }
                  >
                    <td className="p-2">
                      {row.title}
                      {rowErrors[i].length > 0 && (
                        <p className="text-xs text-danger mt-1">
                          {rowErrors[i].join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="p-2">{row.preconditions}</td>
                    <td className="p-2">{row.steps_to_reproduce}</td>
                    <td className="p-2">{row.expected_result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={handleImport} disabled={hasErrors || isImporting}>
            {hasErrors
              ? `Fix ${errorCount} row${errorCount !== 1 ? "s" : ""} to continue`
              : isImporting
                ? "Importing..."
                : `Import ${rows.length} Test Case${rows.length !== 1 ? "s" : ""}`}
          </Button>
        </>
      )}
    </div>
  );
}
