import { createSuite } from "../actions";
import NameDescriptionForm from "@/components/NameDescriptionForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";
import { getProject } from "@/lib/project";

export default async function NewSuite({ params }) {
  const { code } = await params;
  const project = await getProject(code);

  return (
    <main className={PAGE.standard}>
      <BackLink href={`/projects/${project.code}/suites`} label="Suites" />
      <h1 className="mb-6">New Suite</h1>
      <NameDescriptionForm
        action={createSuite}
        hiddenFields={{ projectCode: project.code }}
        initialValues={{ name: "", description: "" }}
        submitLabel="Create Suite"
        pendingLabel="Creating..."
      />
    </main>
  );
}
