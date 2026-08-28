import { supabase } from "@/lib/supabaseClient";
import { addTestCasesToModule, updateModule, cloneModule } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import SortableModuleCases from "./SortableModuleCases";

export default async function ModuleDetail({ params }) {
  const { id } = await params;

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  const { data: linkedCases } = await supabase
    .from("module_cases")
    .select("id, test_case_id, position, test_cases(*)")
    .eq("module_id", id)
    .order("position");

  const { data: allTestCases } = await supabase
    .from("test_cases")
    .select("*")
    .is("archived_at", null);

  const linkedIds = linkedCases.map((lc) => lc.test_case_id);
  const availableTestCases = allTestCases.filter(
    (tc) => !linkedIds.includes(tc.id),
  );

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Badge
          className={
            mod.archived_at
              ? "bg-slate-200 text-slate-600"
              : "bg-emerald-100 text-emerald-700"
          }
        >
          {mod.archived_at ? "Archived" : "Active"}
        </Badge>
        {mod.seq_number && (
          <span className="text-slate-400 text-sm">
            {formatId("M", mod.seq_number)}
          </span>
        )}
        <form action={cloneModule}>
          <input type="hidden" name="moduleId" value={mod.id} />
          <Button type="submit" variant="secondary" size="sm">
            Clone
          </Button>
        </form>
      </div>

      <form action={updateModule} className="space-y-3 mb-8 border-b pb-6">
        <input type="hidden" name="moduleId" value={mod.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={mod.name}
            required
            className="w-full border rounded p-2 text-2xl font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={mod.description}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>

      <h2 className="mb-2">Test Cases in this Module</h2>
      <SortableModuleCases linkedCases={linkedCases} moduleId={mod.id} />

      <h2 className="mb-2">Add More Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-slate-500">
          All test cases are already in this module.
        </p>
      ) : (
        <form action={addTestCasesToModule} className="space-y-2">
          <input type="hidden" name="moduleId" value={mod.id} />
          {availableTestCases.map((tc) => (
            <label
              key={tc.id}
              className="flex items-center gap-2 border rounded p-2"
            >
              <input type="checkbox" name="testCaseIds" value={tc.id} />
              {tc.title}
            </label>
          ))}
          <Button type="submit" className="mt-2">
            Add Selected
          </Button>
        </form>
      )}
    </main>
  );
}
