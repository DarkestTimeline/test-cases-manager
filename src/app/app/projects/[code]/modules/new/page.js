import { createModule } from "../actions";
import NameDescriptionForm from "@/components/NameDescriptionForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";
import { getProject } from "@/lib/project";

export default async function NewModule({ params }) {
  const { code } = await params;
  const project = await getProject(code);

  return (
    <main className={PAGE.standard}>
      <BackLink href={`/projects/${project.code}/modules`} label="Modules" />
      <h1 className="mb-6">New Module</h1>
      <NameDescriptionForm
        action={createModule}
        hiddenFields={{ projectCode: project.code }}
        initialValues={{ name: "", description: "" }}
        submitLabel="Create Module"
        pendingLabel="Creating..."
      />
    </main>
  );
}
