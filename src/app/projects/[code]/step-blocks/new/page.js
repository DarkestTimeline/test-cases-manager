import { createStepBlock } from "../actions";
import StepBlockForm from "@/components/StepBlockForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";
import { getProject } from "@/lib/project";

export const metadata = { title: "New Step Block" };

export default async function NewStepBlock({ params }) {
  const { code } = await params;
  const project = await getProject(code);

  return (
    <main className={PAGE.wide}>
      <BackLink
        href={`/projects/${project.code}/step-blocks`}
        label="Step Blocks"
      />
      <h1 className="mb-2">New Step Block</h1>
      <p className="mb-6 text-sm text-slate-600">
        A reusable set of steps you can add to many test cases.
      </p>
      <StepBlockForm
        action={createStepBlock}
        hiddenFields={{ projectCode: project.code }}
        initialValues={{ title: "", steps: [] }}
        submitLabel="Create Step Block"
        pendingLabel="Creating..."
      />
    </main>
  );
}
