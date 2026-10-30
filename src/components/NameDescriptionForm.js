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

export default function NameDescriptionForm({
  action,
  initialValues,
  hiddenFields = {},
  submitLabel,
  pendingLabel,
  large = false,
  className = "space-y-4",
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [editedAttempt, setEditedAttempt] = useState(-1);
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  // "Changes saved." disappears as soon as the person edits again.
  const showSuccess = Boolean(state.success) && editedAttempt !== state.attempt;
  const nameClass = `w-full border rounded p-2${large ? " text-2xl font-bold text-slate-900" : ""}${
    errors.name ? " border-danger" : ""
  }`;

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

      <Field label="Name" required error={errors.name}>
        <input
          type="text"
          name="name"
          defaultValue={values.name}
          required
          className={nameClass}
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
