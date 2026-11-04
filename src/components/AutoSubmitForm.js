"use client";

import Form from "next/form";

// GET form that re-submits whenever a select, checkbox or date changes.
// Typing in a text box does not submit until Enter (or the Search button).
export default function AutoSubmitForm({ children, ...props }) {
  function handleChange(event) {
    const target = event.target;
    if (target.matches('input[type="text"], input[type="search"], textarea')) {
      return;
    }
    event.currentTarget.requestSubmit();
  }

  return (
    <Form {...props} onChange={handleChange}>
      {children}
    </Form>
  );
}
