import { createModule } from "../actions";
import NameDescriptionForm from "@/components/NameDescriptionForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";

export default function NewModule() {
  return (
    <main className={PAGE.standard}>
      <BackLink href="/modules" label="Modules" />
      <h1 className="mb-6">New Module</h1>
      <NameDescriptionForm
        action={createModule}
        initialValues={{ name: "", description: "" }}
        submitLabel="Create Module"
        pendingLabel="Creating..."
      />
    </main>
  );
}
