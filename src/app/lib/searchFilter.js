function quote(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseCode(term, prefix) {
  const match = term.match(new RegExp(`^${prefix}[-\\s]?(\\d{1,9})$`, "i"));
  return match ? parseInt(match[1], 10) : null;
}

export function buildSearchFilter(search, { prefix, columns }) {
  const term = search.trim();
  const pattern = quote(`%${term}%`);
  const conditions = columns.map((column) => `${column}.ilike.${pattern}`);

  const code = parseCode(term, prefix);
  if (code !== null) conditions.push(`seq_number.eq.${code}`);

  return conditions.join(",");
}
