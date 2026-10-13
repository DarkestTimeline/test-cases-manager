import { createSuite } from "../actions";
import Button from "@/components/Button";
import BackLink from "@/components/BackLink";
import Field, { RequiredNote } from "@/components/Field";

export default function NewSuite() {
  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <BackLink href="/suites" label="Suites" />
      <h1 className="mb-6">New Suite</h1>
      <form action={createSuite} className="space-y-4">
        <RequiredNote />
        <Field label="Name" required>
          <input
            type="text"
            name="name"
            required
            className="w-full border rounded p-2"
          />
        </Field>
        <Field label="Description">
          <textarea
            name="description"
            rows={2}
            className="w-full border rounded p-2"
          />
        </Field>
        <Button type="submit">Create Suite</Button>
      </form>
    </main>
  );
}
