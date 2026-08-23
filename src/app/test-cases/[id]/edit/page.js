import { supabase } from "@/lib/supabaseClient";
import { updateTestCase } from "../../actions";
import Button from "@/components/Button";

export default async function EditTestCase({ params }) {
  const { id } = await params;

  const { data: testCase } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", id)
    .single();
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .is("archived_at", null)
    .order("name");
  const { data: linkedModules } = await supabase
    .from("module_cases")
    .select("module_id")
    .eq("test_case_id", id);

  const linkedModuleIds = linkedModules.map((lm) => lm.module_id);

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Test Case</h1>
      <form action={updateTestCase} className="space-y-4">
        <input type="hidden" name="testCaseId" value={testCase.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            defaultValue={testCase.title}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Preconditions
          </label>
          <textarea
            name="preconditions"
            defaultValue={testCase.preconditions}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Steps to Reproduce
          </label>
          <textarea
            name="steps_to_reproduce"
            defaultValue={testCase.steps_to_reproduce}
            required
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Expected Result
          </label>
          <textarea
            name="expected_result"
            defaultValue={testCase.expected_result}
            required
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>

        {modules.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Modules</label>
            <div className="space-y-1">
              {modules.map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-center gap-2 border rounded p-2"
                >
                  <input
                    type="checkbox"
                    name="moduleIds"
                    value={mod.id}
                    defaultChecked={linkedModuleIds.includes(mod.id)}
                  />
                  {mod.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit">Save Changes</Button>
      </form>
    </main>
  );
}
