import { supabase } from "@/lib/supabaseClient";
import { createTestCase } from "../actions";
import Button from "@/components/Button";

export default async function NewTestCase() {
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .is("archived_at", null)
    .order("name");

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="mb-6">New Test Case</h1>
      <form action={createTestCase} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
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
                  <input type="checkbox" name="moduleIds" value={mod.id} />
                  {mod.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit">Create Test Case</Button>
      </form>
    </main>
  );
}
