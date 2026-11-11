"use client";

import { useActionState } from "react";
import Field, { RequiredNote } from "@/components/Field";
import FormSubmitButton from "@/components/FormSubmitButton";
import RichTextEditor from "@/components/RichTextEditor";
import StepsEditor from "@/components/StepsEditor";
import { PRIORITIES } from "@/lib/testCaseValidation";
import { formatStatusLabel } from "@/lib/formatLabel";

const initialState = { error: null, fieldErrors: {}, values: null, attempt: 0 };

export default function TestCaseForm({
  action,
  modules,
  initialValues,
  projectCode,
  testCaseId,
  blocks,
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
    <form key={state.attempt} action={formAction} className="space-y-6">
      <input type="hidden" name="projectCode" value={projectCode} />
      {testCaseId && (
        <input type="hidden" name="testCaseId" value={testCaseId} />
      )}
      <RequiredNote />
      {state.error && (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      )}

      <div className="space-y-4">
        <Field label="Title" required error={errors.title}>
          <input
            type="text"
            name="title"
            defaultValue={values.title}
            required
            className={inputClass("title")}
          />
        </Field>
        {/* Not a <Field>: a <label> around the editor would steal clicks. */}
        <section aria-labelledby="preconditions-heading">
          <h2 id="preconditions-heading" className="mb-1 text-sm font-medium">
            Preconditions
          </h2>
          <RichTextEditor
            name="preconditions"
            defaultValue={values.preconditions}
            ariaLabel="Preconditions"
            placeholder="What must be true before this test starts?"
            rows={2}
          />
        </section>
      </div>

      {/* Not a <Field>: a <label> around many inputs would steal clicks. */}
      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="mb-2 text-sm font-medium">
          Steps
        </h2>
        {errors.steps && (
          <p role="alert" className="mb-2 text-xs text-danger">
            {errors.steps}
          </p>
        )}
        <StepsEditor
          name="steps"
          defaultValue={values.steps}
          errors={errors.stepRows}
          blocks={blocks}
          projectCode={projectCode}
        />
      </section>

      <div className="space-y-4">
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
      </div>

      <FormSubmitButton pendingLabel={pendingLabel}>
        {submitLabel}
      </FormSubmitButton>
    </form>
  );
}
