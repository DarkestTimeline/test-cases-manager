// Reading and validating the Step Block form. Pure JavaScript, so it runs in
// server actions and in tests alike.

import { normalizeSteps, readStepsField, validateSteps } from "./steps";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function readStepBlockForm(formData) {
  const { steps, error: stepsError } = readStepsField(formData, "steps");
  return {
    title: clean(formData.get("title")),
    steps,
    stepsError,
  };
}

// Returns { field: message }. For the steps there can also be stepRows,
// { rowIndex: message }, shown under the matching row of the editor.
export function validateStepBlock(values) {
  const errors = {};
  if (!values.title) errors.title = "Step block title is required.";

  if (values.stepsError) {
    errors.steps = values.stepsError;
  } else {
    const stepRows = validateSteps(values.steps);
    if (Object.keys(stepRows).length > 0) {
      errors.steps = "Fix the highlighted steps.";
      errors.stepRows = stepRows;
    } else if (normalizeSteps(values.steps).length === 0) {
      // A block with no steps would be useless to insert anywhere.
      errors.steps = "Add at least one step.";
    }
  }
  return errors;
}
