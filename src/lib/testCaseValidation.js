import { parseIdParam } from "./params";
import { readStepsField, validateSteps } from "./steps";

export const PRIORITIES = ["low", "medium", "high", "critical"];
export const DEFAULT_PRIORITY = "medium";
export const MAX_IMPORT_ROWS = 500;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Used by the import preview and by the server. Returns a list of problems.
export function validateRow(row) {
  const errors = [];
  if (!clean(row?.title)) errors.push("Missing title");
  return errors;
}

// Reads the create/edit form into trimmed values.
export function readTestCaseForm(formData) {
  const moduleIds = formData
    .getAll("moduleIds")
    .map((id) => parseIdParam(clean(id)))
    .filter(Boolean);

  const { steps, error: stepsError } = readStepsField(formData, "steps");

  return {
    title: clean(formData.get("title")),
    preconditions: clean(formData.get("preconditions")),
    steps,
    stepsError,
    priority: clean(formData.get("priority")).toLowerCase(),
    moduleIds: [...new Set(moduleIds)],
  };
}

// Returns { fieldName: "message" }. An empty object means valid.
export function validateTestCase(values) {
  const errors = {};
  if (!values.title) errors.title = "Title is required.";
  if (!PRIORITIES.includes(values.priority))
    errors.priority = "Choose a valid priority.";

  if (values.stepsError) {
    errors.steps = values.stepsError;
  } else {
    // { rowIndex: message }, shown under the matching step row.
    const stepRows = validateSteps(values.steps);
    if (Object.keys(stepRows).length > 0) {
      errors.steps = "Fix the highlighted steps.";
      errors.stepRows = stepRows;
    }
  }
  return errors;
}
