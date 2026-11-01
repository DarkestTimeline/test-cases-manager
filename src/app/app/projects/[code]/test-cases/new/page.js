import { createClient } from "@/lib/supabase/server";
import { createTestCase } from "../actions";
import TestCaseForm from "../TestCaseForm";
import { PAGE } from "@/lib/pageWidths";
import { DEFAULT_PRIORITY } from "@/lib/testCaseValidation";
import { getProject } from "@/lib/project";

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

  return (
    <main className={PAGE.standard}>
      <h1 className="mb-6">New Test Case</h1>
      <TestCaseForm
        action={createTestCase}
        projectCode={project.code}
        modules={modules || []}
        initialValues={{
          title: "",
          preconditions: "",
          steps_to_reproduce: "",
          expected_result: "",
          priority: DEFAULT_PRIORITY,
          moduleIds: [],
        }}
        submitLabel="Create Test Case"
        pendingLabel="Creating..."
      />
    </main>
  );
}
