// Rich text helpers. Pure JavaScript (no React, no Tiptap), so they run in
// server actions, server components and the browser alike.
//
// Rich text is stored as Tiptap / ProseMirror JSON in a jsonb column:
//   { type: "doc", content: [ { type: "paragraph", content: [...] }, ... ] }
//
// Anything coming from the browser is untrusted, so it goes through
// sanitizeRichText() before it is saved: unknown node and mark types are
// dropped, links are limited to http / https / mailto, and the size is capped.

export const MAX_RICH_TEXT_LENGTH = 50000; // characters of JSON
const MAX_DEPTH = 8;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "code"]);

export function emptyDoc() {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

// Returns the href if it is safe to link to, otherwise null.
export function safeHref(value) {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > 2000) return null;
  try {
    return ALLOWED_PROTOCOLS.has(new URL(href).protocol) ? href : null;
  } catch {
    return null;
  }
}

function cleanMarks(marks) {
  if (!Array.isArray(marks)) return undefined;
  const out = [];
  const seen = new Set();
  for (const mark of marks) {
    const type = mark?.type;
    if (seen.has(type)) continue;
    if (SIMPLE_MARKS.has(type)) {
      out.push({ type });
      seen.add(type);
    } else if (type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) {
        out.push({ type: "link", attrs: { href } });
        seen.add(type);
      }
    }
  }
  // Inline code cannot be combined with other formatting.
  if (seen.has("code")) return [{ type: "code" }];
  return out.length ? out : undefined;
}

function cleanInline(nodes) {
  if (!Array.isArray(nodes)) return [];
  const out = [];
  for (const node of nodes) {
    if (node?.type === "hardBreak") {
      out.push({ type: "hardBreak" });
    } else if (node?.type === "text" && typeof node.text === "string") {
      if (!node.text) continue;
      const marks = cleanMarks(node.marks);
      out.push(marks ? { type: "text", text: node.text, marks } : { type: "text", text: node.text });
    }
  }
  return out;
}

function cleanListItem(node, depth) {
  const blocks = cleanBlocks(node?.content, depth + 1);
  // A list item always starts with a paragraph.
  if (!blocks.length || blocks[0].type !== "paragraph") {
    blocks.unshift({ type: "paragraph" });
  }
  return { type: "listItem", content: blocks };
}

function cleanBlock(node, depth) {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null;

  switch (node.type) {
    case "paragraph": {
      const content = cleanInline(node.content);
      return content.length
        ? { type: "paragraph", content }
        : { type: "paragraph" };
    }
    case "codeBlock": {
      const text = (Array.isArray(node.content) ? node.content : [])
        .map((child) =>
          child?.type === "hardBreak"
            ? "\n"
            : typeof child?.text === "string"
              ? child.text
              : "",
        )
        .join("");
      return text
        ? { type: "codeBlock", content: [{ type: "text", text }] }
        : { type: "codeBlock" };
    }
    case "bulletList":
    case "orderedList": {
      const items = (Array.isArray(node.content) ? node.content : [])
        .filter((child) => child?.type === "listItem")
        .map((child) => cleanListItem(child, depth));
      if (!items.length) return null;
      const list = { type: node.type, content: items };
      const start = node.attrs?.start;
      if (node.type === "orderedList" && Number.isInteger(start) && start > 1 && start < 10000) {
        list.attrs = { start };
      }
      return list;
    }
    default:
      return null;
  }
}

function isBlankParagraph(node) {
  return node.type === "paragraph" && !node.content?.length;
}

function cleanBlocks(nodes, depth) {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => cleanBlock(node, depth)).filter(Boolean);
}

// Accepts a doc object or a JSON string. Returns a clean doc, or null if the
// value is not a rich text document at all.
export function sanitizeRichText(value) {
  let doc = value;
  if (typeof value === "string") {
    if (value.length > MAX_RICH_TEXT_LENGTH) return null;
    try {
      doc = JSON.parse(value);
    } catch {
      return null;
    }
  } else if (value && typeof value === "object") {
    if (JSON.stringify(value).length > MAX_RICH_TEXT_LENGTH) return null;
  }
  if (!doc || typeof doc !== "object" || doc.type !== "doc") return null;

  const blocks = cleanBlocks(doc.content, 1);
  // Drop blank paragraphs at the end (the editor adds one after lists and
  // code blocks so the cursor can leave them).
  while (blocks.length > 1 && isBlankParagraph(blocks[blocks.length - 1])) {
    blocks.pop();
  }
  return { type: "doc", content: blocks.length ? blocks : [{ type: "paragraph" }] };
}

// One paragraph per line. Used for legacy plain text and CSV import.
export function plainTextToDoc(text) {
  const value = typeof text === "string" ? text.slice(0, MAX_RICH_TEXT_LENGTH) : "";
  const lines = value.split(/\r?\n/);
  return {
    type: "doc",
    content: lines.map((line) =>
      line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" },
    ),
  };
}

// Turns whatever is stored (doc object, JSON string, plain text, null) into a
// clean doc that is safe to hand to the editor or the viewer.
export function parseRichText(value) {
  if (value == null || value === "") return emptyDoc();
  if (typeof value === "object") return sanitizeRichText(value) ?? emptyDoc();
  if (typeof value === "string") {
    if (value.trimStart().startsWith("{")) {
      const doc = sanitizeRichText(value);
      if (doc) return doc;
    }
    return plainTextToDoc(value);
  }
  return emptyDoc();
}

function blockLines(node, indent) {
  switch (node.type) {
    case "paragraph":
      return [indent + inlineText(node)];
    case "codeBlock":
      return inlineText(node)
        .split("\n")
        .map((line) => indent + line);
    case "bulletList":
    case "orderedList": {
      const lines = [];
      const start = node.attrs?.start ?? 1;
      node.content.forEach((item, index) => {
        const marker = node.type === "bulletList" ? "- " : `${start + index}. `;
        const childLines = item.content.flatMap((child) =>
          blockLines(child, indent + "  "),
        );
        if (childLines.length) {
          // The first line carries the bullet / number instead of the indent.
          childLines[0] = indent + marker + childLines[0].slice(indent.length + 2);
        } else {
          childLines.push(indent + marker.trimEnd());
        }
        lines.push(...childLines);
      });
      return lines;
    }
    default:
      return [];
  }
}

function inlineText(node) {
  return (node.content ?? [])
    .map((child) => (child.type === "hardBreak" ? "\n" : child.text))
    .join("");
}

// Plain text version, for search, CSV export and report tables.
export function richTextToPlainText(value) {
  const doc = parseRichText(value);
  return doc.content
    .flatMap((node) => blockLines(node, ""))
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function isRichTextEmpty(value) {
  return richTextToPlainText(value) === "";
}

// What goes in the hidden form field: clean JSON, or "" when there is no text.
export function serializeRichText(value) {
  const doc = sanitizeRichText(value);
  return doc && !isRichTextEmpty(doc) ? JSON.stringify(doc) : "";
}

// Reads one rich text field from submitted form data. Returns a clean doc to
// store in a jsonb column, or null when the field is empty or invalid.
export function readRichTextField(formData, name) {
  const raw = formData.get(name);
  if (typeof raw !== "string" || !raw.trim()) return null;
  const doc = sanitizeRichText(raw);
  return doc && !isRichTextEmpty(doc) ? doc : null;
}
