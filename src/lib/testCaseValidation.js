export function validateRow(row) {
  const errors = [];
  if (!row.title || !row.title.trim()) errors.push("Missing title");
  if (!row.steps_to_reproduce || !row.steps_to_reproduce.trim())
    errors.push("Missing steps to reproduce");
  if (!row.expected_result || !row.expected_result.trim())
    errors.push("Missing expected result");
  return errors;
}
