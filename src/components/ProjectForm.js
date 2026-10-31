"use client";

import { useActionState, useState } from "react";
import Field, { RequiredNote } from "@/components/Field";
import FormSubmitButton from "@/components/FormSubmitButton";

const initialState = {
  error: null,
  fieldErrors: {},
  values: null,
  success: null,
  attempt: 0,
};

// Same behaviour as NameDescriptionForm, plus the project code.
// Pass `lockedCode` to show the code read-only (edit mode); omit it for an
// editable code field (create mode).
export default function ProjectForm({
  action,
  initialValues,
  hiddenFields = {},
  lockedCode = null,
  submitLabel,
  pendingLabel,
  className = "space-y-4",
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [editedAttempt, setEditedAttempt] = useState(-1);
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  const showSuccess = Boolean(state.success) && editedAttempt !== state.attempt;

  return (
    <form
      key={state.attempt}
      action={formAction}
      onChange={() => setEditedAttempt(state.attempt)}
      className={className}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <RequiredNote />
      {state.error && (
        <p role="alert" className="text-danger text-sm">
          {state.error}
        </p>
      )}

      {lockedCode ? (
        <div>
          <span className="block text-sm font-medium mb-1">Code</span>
          <p className="font-mono text-slate-700">{lockedCode}</p>
          <p className="text-xs text-slate-500 mt-1">
            The code is used in URLs and test case IDs and cannot be changed.
          </p>
        </div>
      ) : (
        <Field label="Code" required error={errors.code}>
          <input
            type="text"
            name="code"
            defaultValue={values.code}
            required
            maxLength={10}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="DEMO"
            className={`w-full border rounded p-2 font-mono uppercase${
              errors.code ? " border-danger" : ""
            }`}
          />
          <p className="text-xs text-slate-500 mt-1">
            2–10 letters or digits. Used in URLs and test case IDs (for example
            DEMO-12). Cannot be changed later.
          </p>
        </Field>
      )}

      <Field label="Name" required error={errors.name}>
        <input
          type="text"
          name="name"
          defaultValue={values.name}
          required
          className={`w-full border rounded p-2${
            errors.name ? " border-danger" : ""
          }`}
        />
      </Field>
      <Field label="Description">
        <textarea
          name="description"
          defaultValue={values.description}
          rows={2}
          className="w-full border rounded p-2"
        />
      </Field>

      {showSuccess && (
        <p role="status" className="text-success text-sm">
          {state.success}
        </p>
      )}
      <FormSubmitButton pendingLabel={pendingLabel}>
        {submitLabel}
      </FormSubmitButton>
    </form>
  );
}
