import { createClient } from "@/lib/supabase/server";
import { createTestCase } from "../actions";
import TestCaseForm from "../TestCaseForm";
import { PAGE } from "@/lib/pageWidths";
import { DEFAULT_PRIORITY } from "@/lib/testCaseValidation";

export default async function NewTestCase() {
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .is("archived_at", null)
    .order("name");

  return (
    <main className={PAGE.standard}>
      <h1 className="mb-6">New Test Case</h1>
      <TestCaseForm
        action={createTestCase}
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
