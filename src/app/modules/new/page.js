import { createModule } from "../actions";
import Button from "@/components/Button";
import BackLink from "@/components/BackLink";
import Field, { RequiredNote } from "@/components/Field";
import { PAGE } from '@/lib/pageWidths'

export default function NewModule() {
  return (
    <main className={PAGE.standard}>
      <BackLink href="/modules" label="Modules" />
      <h1 className="mb-6">New Module</h1>
      <form action={createModule} className="space-y-4">
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
