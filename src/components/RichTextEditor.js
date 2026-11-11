"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { parseRichText, serializeRichText } from "@/lib/richText";

// The one rich text editor used across the app. It keeps its content in a
// hidden form field (as JSON), so it works with plain <form action={...}>
// server actions exactly like a text input does. Read it on the server with
// readRichTextField(formData, name) from "@/lib/richText".
//
// Props
//   name          hidden field name (the form value is "" when empty)
//   defaultValue  stored JSON, a JSON string, plain text or null (initial only)
//   onChange      optional, called with the doc (or null when empty)
//   placeholder   hint text shown while empty
//   compact       single-row look for table cells; toolbar floats on focus
//   rows          height of the empty box when not compact: 1, 2 or 4 (default)
//   invalid       red border, for validation errors
//   disabled      read-only
//   ariaLabel     accessible name when there is no visible <label>

// A deliberately small feature set: bold, italic, inline code, code blocks,
// bullet / numbered lists and links. Everything else is switched off.
const BASE_EXTENSION = StarterKit.configure({
  heading: false,
  blockquote: false,
  horizontalRule: false,
  strike: false,
  underline: false,
  dropcursor: false,
  gapcursor: false,
  link: {
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: "https",
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
  },
});

const MIN_HEIGHT = { 1: "min-h-9", 2: "min-h-16", 4: "min-h-24" };

function Svg({ children }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  bold: (
    <Svg>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
      <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
    </Svg>
  ),
  italic: (
    <Svg>
      <path d="M10 5h8" />
      <path d="M6 19h8" />
      <path d="M15 5 9 19" />
    </Svg>
  ),
  code: (
    <Svg>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
    </Svg>
  ),
  bulletList: (
    <Svg>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </Svg>
  ),
  orderedList: (
    <Svg>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M4 5l1.5-1V9" />
      <path d="M3.5 13.5a1.5 1.5 0 0 1 3 0c0 1.2-3 2-3 3.5h3" />
    </Svg>
  ),
  codeBlock: (
    <Svg>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m10 10-2 2 2 2" />
      <path d="m14 10 2 2-2 2" />
    </Svg>
  ),
  link: (
    <Svg>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33" />
    </Svg>
  ),
};

function ToolbarButton({ label, shortcut, icon, active, onClick }) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      // Keep the editor focused (and the selection intact) when clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? "bg-primary-light text-primary"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {ICONS[icon]}
    </button>
  );
}

function Toolbar({ editor, compact }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive("bold") ?? false,
      italic: ed?.isActive("italic") ?? false,
      code: ed?.isActive("code") ?? false,
      bulletList: ed?.isActive("bulletList") ?? false,
      orderedList: ed?.isActive("orderedList") ?? false,
      codeBlock: ed?.isActive("codeBlock") ?? false,
      link: ed?.isActive("link") ?? false,
    }),
  });

  function setLink() {
    const previous = editor.getAttributes("link").href ?? "https://";
    const url = window.prompt("Link address", previous);
    if (url === null) return; // cancelled
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url.trim() === "") chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  }

  const run = (command) => () => command(editor.chain().focus()).run();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className={
        compact
          ? "absolute -top-9 left-0 z-20 hidden gap-0.5 rounded border bg-white p-1 shadow-md group-focus-within:flex"
          : "flex flex-wrap gap-0.5 border-b p-1"
      }
    >
      <ToolbarButton label="Bold" shortcut="Ctrl+B" icon="bold" active={active.bold} onClick={run((c) => c.toggleBold())} />
      <ToolbarButton label="Italic" shortcut="Ctrl+I" icon="italic" active={active.italic} onClick={run((c) => c.toggleItalic())} />
      <ToolbarButton label="Inline code" shortcut="Ctrl+E" icon="code" active={active.code} onClick={run((c) => c.toggleCode())} />
      <ToolbarButton label="Bulleted list" icon="bulletList" active={active.bulletList} onClick={run((c) => c.toggleBulletList())} />
      <ToolbarButton label="Numbered list" icon="orderedList" active={active.orderedList} onClick={run((c) => c.toggleOrderedList())} />
      <ToolbarButton label="Code block" icon="codeBlock" active={active.codeBlock} onClick={run((c) => c.toggleCodeBlock())} />
      <ToolbarButton label="Link" icon="link" active={active.link} onClick={setLink} />
    </div>
  );
}

export default function RichTextEditor({
  name,
  defaultValue,
  onChange,
  placeholder = "",
  compact = false,
  rows = 4,
  invalid = false,
  disabled = false,
  ariaLabel,
  autoFocus = false,
}) {
  // The starting content is read once. The hidden field starts with it too, so
  // a form submitted before the editor has loaded still sends the right value.
  const [initialDoc] = useState(() => parseRichText(defaultValue));
  const [serialized, setSerialized] = useState(() => serializeRichText(initialDoc));

  const editor = useEditor({
    extensions: [BASE_EXTENSION, Placeholder.configure({ placeholder })],
    content: initialDoc,
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    // Next.js renders on the server first; the editor starts in the browser.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: compact
          ? "rich-text min-h-9 px-2 py-1.5 text-sm focus:outline-none"
          : `rich-text ${MIN_HEIGHT[rows] ?? MIN_HEIGHT[4]} px-2 py-2 text-sm focus:outline-none`,
        role: "textbox",
        "aria-multiline": "true",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const doc = ed.getJSON();
      const value = serializeRichText(doc);
      setSerialized(value);
      onChange?.(value ? JSON.parse(value) : null);
    },
  });

  return (
    <div
      className={`rich-text-field group relative rounded border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
        invalid ? "border-danger" : ""
      } ${disabled ? "opacity-60" : ""}`}
    >
      {name && <input type="hidden" name={name} value={serialized} />}
      {editor && !disabled && <Toolbar editor={editor} compact={compact} />}
      <EditorContent editor={editor} />
    </div>
  );
}
