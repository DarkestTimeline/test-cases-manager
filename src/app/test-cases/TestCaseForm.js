"use client";

import { useActionState } from "react";
import Field, { RequiredNote } from "@/components/Field";
import FormSubmitButton from "@/components/FormSubmitButton";
import { PRIORITIES } from "@/lib/testCaseValidation";
import { formatStatusLabel } from "@/lib/formatLabel";

const initialState = { error: null, fieldErrors: {}, values: null, attempt: 0 };

export default function TestCaseForm({
  action,
  modules,
  initialValues,
  testCaseId,
  submitLabel,
  pendingLabel,
}) {
  const [state, formAction] = useActionState(action, initialState);
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  const selectedModules = new Set(values.moduleIds);
  const inputClass = (name) =>
    `w-full border rounded p-2${errors[name] ? " border-danger" : ""}`;

  return (
    <form key={state.attempt} action={formAction} className="space-y-4">
      {testCaseId && (
        <input type="hidden" name="testCaseId" value={testCaseId} />
      )}
      <RequiredNote />
      {state.error && (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      )}

      <Field label="Title" required error={errors.title}>
        <input
          type="text"
          name="title"
          defaultValue={values.title}
          required
          className={inputClass("title")}
        />
      </Field>
      <Field label="Preconditions">
        <textarea
          name="preconditions"
          defaultValue={values.preconditions}
          rows={2}
          className={inputClass("preconditions")}
        />
      </Field>
      <Field
        label="Steps to Reproduce"
        required
        error={errors.steps_to_reproduce}
      >
        <textarea
          name="steps_to_reproduce"
          defaultValue={values.steps_to_reproduce}
          required
          rows={4}
          className={inputClass("steps_to_reproduce")}
        />
      </Field>
      <Field label="Expected Result" required error={errors.expected_result}>
        <textarea
          name="expected_result"
          defaultValue={values.expected_result}
          required
          rows={2}
          className={inputClass("expected_result")}
        />
      </Field>
      <Field label="Priority" error={errors.priority}>
        <select
          name="priority"
          defaultValue={values.priority}
          className={inputClass("priority")}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {formatStatusLabel(p)}
            </option>
          ))}
        </select>
      </Field>

      {modules.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Modules</p>
          <div className="space-y-1">
            {modules.map((mod) => (
              <label
                key={mod.id}
                className="flex items-center gap-2 border rounded p-2"
              >
                <input
                  type="checkbox"
                  name="moduleIds"
                  value={mod.id}
                  defaultChecked={selectedModules.has(mod.id)}
                />
                {mod.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <FormSubmitButton pendingLabel={pendingLabel}>
        {submitLabel}
      </FormSubmitButton>
    </form>
  );
}
