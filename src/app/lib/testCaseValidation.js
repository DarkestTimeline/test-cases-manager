import { parseIdParam } from "./params";

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
  if (!clean(row?.steps_to_reproduce)) errors.push("Missing steps");
  if (!clean(row?.expected_result)) errors.push("Missing expected result");
  return errors;
}

// Reads the create/edit form into trimmed values.
export function readTestCaseForm(formData) {
  const moduleIds = formData
    .getAll("moduleIds")
    .map((id) => parseIdParam(clean(id)))
    .filter(Boolean);

  return {
    title: clean(formData.get("title")),
    preconditions: clean(formData.get("preconditions")),
    steps_to_reproduce: clean(formData.get("steps_to_reproduce")),
    expected_result: clean(formData.get("expected_result")),
    priority: clean(formData.get("priority")).toLowerCase(),
    moduleIds: [...new Set(moduleIds)],
  };
}

// Returns { fieldName: "message" }. An empty object means valid.
export function validateTestCase(values) {
  const errors = {};
  if (!values.title) errors.title = "Title is required.";
  if (!values.steps_to_reproduce)
    errors.steps_to_reproduce = "Steps to reproduce are required.";
  if (!values.expected_result)
    errors.expected_result = "Expected result is required.";
  if (!PRIORITIES.includes(values.priority))
    errors.priority = "Choose a valid priority.";
  return errors;
}
