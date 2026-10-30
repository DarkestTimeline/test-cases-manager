import { createSuite } from "../actions";
import NameDescriptionForm from "@/components/NameDescriptionForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";

export default function NewSuite() {
  return (
    <main className={PAGE.standard}>
      <BackLink href="/suites" label="Suites" />
      <h1 className="mb-6">New Suite</h1>
      <NameDescriptionForm
        action={createSuite}
        initialValues={{ name: "", description: "" }}
        submitLabel="Create Suite"
        pendingLabel="Creating..."
      />
    </main>
  );
}
