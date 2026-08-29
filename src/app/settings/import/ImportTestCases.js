"use client";

import { useState } from "react";
import Papa from "papaparse";
import Button from "@/components/Button";
import { downloadFile } from "@/lib/downloadFile";
import { validateRow } from "@/lib/testCaseValidation";
import { importTestCases } from "@/app/test-cases/actions";
import Badge from "@/components/Badge";

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
      <h2 className="mb-4">Import Test Cases</h2>
      <p className="text-slate-600 mb-2">
        Upload a CSV with columns:{" "}
        <code className="bg-slate-100 px-1 rounded">title</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">preconditions</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">steps_to_reproduce</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">expected_result</code>
      </p>

      <div className="mb-4">
        <Button onClick={handleDownloadTemplate} variant="secondary" size="sm">
          Download a blank template
        </Button>
      </div>

      <div className="mb-6">
        <input
          key={fileInputKey}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block text-sm text-slate-600 cursor-pointer
      file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
      file:text-sm file:font-medium file:bg-primary file:text-white
      hover:file:bg-primary-hover file:cursor-pointer"
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
          <p className="text-sm mb-2 flex items-center gap-2">
            Found {rows.length} row{rows.length !== 1 ? "s" : ""} in {fileName}
            {hasErrors && (
              <Badge className="bg-red-100 text-red-700">
                {errorCount} row{errorCount !== 1 ? "s" : ""} need attention
              </Badge>
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
                    <td className="p-2 align-top">
                      {row.title || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                      {rowErrors[i].length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rowErrors[i].map((err) => (
                            <Badge
                              key={err}
                              className="bg-red-100 text-red-700"
                            >
                              {err}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {row.preconditions || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {row.steps_to_reproduce || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {row.expected_result || (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
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
