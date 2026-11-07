"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextView from "@/components/RichTextView";
import { readRichTextField, richTextToPlainText } from "@/lib/richText";

const STEP_SAMPLE = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Registry key: " },
        { type: "text", text: "DisableRDP", marks: [{ type: "code" }] },
        { type: "text", text: " hides the Screen Sharing option" },
      ],
    },
  ],
};

const LIST_SAMPLE = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Valid formats:" }] },
    {
      type: "bulletList",
      content: [
        ["10.0.0.4", "matches only 10.0.0.4"],
        ["192.168.0.0/29", "matches 192.168.0.0 to 192.168.0.7"],
        ["192.168.0.*", "matches every address that starts with 192.168.0"],
      ].map(([code, text]) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: code, marks: [{ type: "code" }] },
              { type: "text", text: " " + text },
            ],
          },
        ],
      })),
    },
  ],
};

// A hostile document, to show the viewer ignores what it should not render.
const HOSTILE = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "A link that must not be clickable",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
    { type: "script", content: [{ type: "text", text: "alert(1)" }] },
    { type: "paragraph", content: [{ type: "text", text: "Safe text after it." }] },
  ],
};

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Playground() {
  const [doc, setDoc] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSubmitted({
      raw: formData.get("demo"),
      afterServerRead: readRichTextField(formData, "demo"),
    });
  }

  return (
    <>
      <Section title="1. Full editor, inside a form">
        <form onSubmit={handleSubmit} className="space-y-3">
          <RichTextEditor
            name="demo"
            defaultValue={LIST_SAMPLE}
            placeholder="Type something..."
            ariaLabel="Demo rich text"
            onChange={setDoc}
          />
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Submit form
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Read-only view</h3>
            <div className="rounded border p-2 text-sm">
              <RichTextView value={doc ?? LIST_SAMPLE} empty={<span className="text-slate-400">Empty</span>} />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Plain text (search, CSV)</h3>
            <pre className="whitespace-pre-wrap rounded border p-2 text-xs">
              {richTextToPlainText(doc ?? LIST_SAMPLE) || "(empty)"}
            </pre>
          </div>
        </div>

        {submitted && (
          <div>
            <h3 className="mb-1 text-sm font-semibold">
              What the server action would receive
            </h3>
            <pre className="overflow-x-auto rounded border p-2 text-xs">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </div>
        )}
      </Section>

      <Section title="2. Compact editors (how step table cells will look)">
        <p className="text-sm text-slate-500">
          Click a cell: the formatting toolbar floats above it.
        </p>
        <div className="space-y-2 pt-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="grid grid-cols-[2rem_1fr_1fr_1fr] items-start gap-3">
              <span className="pt-2 text-sm text-slate-500">{n}</span>
              <RichTextEditor compact defaultValue={n === 1 ? STEP_SAMPLE : null} placeholder="Step action" ariaLabel={`Step ${n} action`} />
              <RichTextEditor compact placeholder="Data" ariaLabel={`Step ${n} data`} />
              <RichTextEditor compact placeholder="Expected result" ariaLabel={`Step ${n} expected result`} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="3. Viewer edge cases">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Legacy plain text</h3>
            <div className="rounded border p-2 text-sm">
              <RichTextView value={"1. Open the app\n2. Click Settings\n\nThen close it."} />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Hostile document</h3>
            <div className="rounded border p-2 text-sm">
              <RichTextView value={HOSTILE} />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Empty value</h3>
            <div className="rounded border p-2 text-sm">
              <RichTextView value={null} empty={<span className="text-slate-400">No content</span>} />
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Disabled editor</h3>
            <RichTextEditor disabled defaultValue={STEP_SAMPLE} ariaLabel="Disabled demo" />
          </div>
        </div>
      </Section>
    </>
  );
}
