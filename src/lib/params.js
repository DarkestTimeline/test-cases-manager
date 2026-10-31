const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROJECT_CODE_PATTERN = /^[A-Z0-9]{2,10}$/;

export function parseIdParam(value) {
  return UUID_PATTERN.test(value || "") ? value : null;
}

export function parseDateParam(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : null;
}

// Project codes are stored uppercase; URLs are matched case-insensitively.
export function parseProjectCode(value) {
  const code = typeof value === "string" ? value.toUpperCase() : "";
  return PROJECT_CODE_PATTERN.test(code) ? code : null;
}
