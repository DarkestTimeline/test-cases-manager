import { createClient } from "@/lib/supabase/server";
import { createTestCase } from "../actions";
import TestCaseForm from "../TestCaseForm";
import { PAGE } from "@/lib/pageWidths";
import { DEFAULT_PRIORITY } from "@/lib/testCaseValidation";
import { getProject } from "@/lib/project";
import { loadBlocksForForm } from "@/lib/stepBlocks";

export default async function NewTestCase({ params }) {
  const { code } = await params;
  const project = await getProject(code);
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .eq("project_id", project.id)
    .is("archived_at", null)
    .order("name");
  const blocks = await loadBlocksForForm(supabase, project.id);

  return (
    <main className={PAGE.wide}>
      <h1 className="mb-6">New Test Case</h1>
      <TestCaseForm
        action={createTestCase}
        projectCode={project.code}
        modules={modules || []}
        blocks={blocks}
        initialValues={{
          title: "",
          preconditions: "",
          steps: [],
          priority: DEFAULT_PRIORITY,
          moduleIds: [],
        }}
        submitLabel="Create Test Case"
        pendingLabel="Creating..."
      />
    </main>
  );
}
