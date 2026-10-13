const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseIdParam(value) {
  return UUID_PATTERN.test(value || "") ? value : null;
}

export function parseDateParam(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : null;
}
