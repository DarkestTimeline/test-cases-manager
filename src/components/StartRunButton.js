"use client";

import { useState } from "react";
import { startRun } from "@/app/runs/actions";
import Button from "./Button";
import Modal from "./Modal";
import FormSubmitButton from "./FormSubmitButton";
import Field from "@/components/Field";

export default function StartRunButton({ suites }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="success">
        Start Run
      </Button>

      {isOpen && (
        <Modal label="Start a run" onClose={() => setIsOpen(false)}>
          <h2 className="mb-4">Start a Run</h2>

          {suites.length === 0 ? (
            <p className="text-slate-500">
              No suites exist yet — create one first.
            </p>
          ) : (
            <form action={startRun} className="space-y-4">
              <Field label="Suite">
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
              </Field>
              <Field label="OS">
                <input
                  type="text"
                  name="os"
                  placeholder="e.g. macOS 15, Windows 11"
                  className="w-full border rounded p-2"
                />
              </Field>
              <Field label="Build / Version">
                <input
                  type="text"
                  name="build_version"
                  placeholder="e.g. v2.4.1"
                  className="w-full border rounded p-2"
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <FormSubmitButton
                  variant="success"
                  size="sm"
                  pendingLabel="Starting..."
                >
                  Start Run
                </FormSubmitButton>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
