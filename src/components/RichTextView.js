import { Fragment } from "react";
import { parseRichText, isRichTextEmpty, safeHref } from "@/lib/richText";

// Read-only display of rich text. It has no hooks and no browser APIs, so it
// works in server components and client components alike. It draws React
// elements from the stored JSON (never raw HTML), and re-checks the document
// first, so nothing unexpected can be rendered.

function hasMark(node, type) {
  return node.marks?.some((mark) => mark.type === type);
}

function renderInline(node, key) {
  if (node.type === "hardBreak") return <br key={key} />;

  let element = node.text;
  if (hasMark(node, "code")) element = <code>{element}</code>;
  if (hasMark(node, "bold")) element = <strong>{element}</strong>;
  if (hasMark(node, "italic")) element = <em>{element}</em>;

  const link = node.marks?.find((mark) => mark.type === "link");
  const href = link && safeHref(link.attrs?.href);
  if (href) {
    element = (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {element}
      </a>
    );
  }
  return <Fragment key={key}>{element}</Fragment>;
}

function renderBlock(node, key) {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key}>
          {node.content?.length ? node.content.map(renderInline) : <br />}
        </p>
      );
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{node.content?.[0]?.text ?? ""}</code>
        </pre>
      );
    case "bulletList":
      return <ul key={key}>{node.content.map(renderItem)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={node.attrs?.start}>
          {node.content.map(renderItem)}
        </ol>
      );
    default:
      return null;
  }
}

function renderItem(item, key) {
  return <li key={key}>{item.content.map(renderBlock)}</li>;
}

export default function RichTextView({ value, className = "", empty = null }) {
  const doc = parseRichText(value);
  if (isRichTextEmpty(doc)) return empty;

  return <div className={`rich-text ${className}`.trim()}>{doc.content.map(renderBlock)}</div>;
}
