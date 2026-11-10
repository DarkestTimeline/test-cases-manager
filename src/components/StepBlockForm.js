"use client";

import { useActionState, useState } from "react";
import Field, { RequiredNote } from "@/components/Field";
import FormSubmitButton from "@/components/FormSubmitButton";
import StepsEditor from "@/components/StepsEditor";

const initialState = {
  error: null,
  fieldErrors: {},
  values: null,
  success: null,
  attempt: 0,
};

// Create / edit form for a Step Block: a title and its steps.
export default function StepBlockForm({
  action,
  initialValues,
  hiddenFields = {},
  submitLabel,
  pendingLabel,
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [editedAttempt, setEditedAttempt] = useState(-1);
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};
  // "Changes saved." disappears as soon as the person edits again. The steps
  // editor is contenteditable, so it reports edits as input events.
  const showSuccess = Boolean(state.success) && editedAttempt !== state.attempt;
  const markEdited = () => setEditedAttempt(state.attempt);

  return (
    <form
      key={state.attempt}
      action={formAction}
      onChange={markEdited}
      onInput={markEdited}
      className="space-y-6"
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

      <Field label="Title" required error={errors.title}>
        <input
          type="text"
          name="title"
          defaultValue={values.title}
          required
          placeholder="For example: Sign in as a standard user"
          className={`w-full border rounded p-2${errors.title ? " border-danger" : ""}`}
        />
      </Field>

      {/* Not a <Field>: a <label> around many inputs would steal clicks. */}
      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="mb-2 text-sm font-medium">
          Steps
          <span aria-hidden="true" className="text-danger ml-0.5">
            *
          </span>
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
        />
      </section>

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
