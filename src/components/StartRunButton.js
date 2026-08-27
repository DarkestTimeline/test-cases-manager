"use client";

import { useState } from "react";
import { startRun } from "@/app/runs/actions";
import Button from "./Button";

export default function StartRunButton({ suites }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="success">
        Start Run
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4">Start a Run</h2>

            {suites.length === 0 ? (
              <p className="text-slate-500">
                No suites exist yet — create one first.
              </p>
            ) : (
              <form action={startRun} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Suite
                  </label>
                  <select
                    name="suiteId"
                    required
                    className="w-full border rounded p-2"
                  >
                    {suites.map((suite) => (
                      <option key={suite.id} value={suite.id}>
                        {suite.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tester Name
                  </label>
                  <input
                    type="text"
                    name="testerName"
                    required
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OS</label>
                  <input
                    type="text"
                    name="os"
                    placeholder="e.g. macOS 15, Windows 11"
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Build / Version
                  </label>
                  <input
                    type="text"
                    name="build_version"
                    placeholder="e.g. v2.4.1"
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="success" size="sm">
                    Start Run
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
