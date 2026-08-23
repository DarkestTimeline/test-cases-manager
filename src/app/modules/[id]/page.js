import { supabase } from "@/lib/supabaseClient";
import { addTestCasesToModule, removeTestCaseFromModule } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";

export default async function ModuleDetail({ params }) {
  const { id } = await params;

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  const { data: linkedCases } = await supabase
    .from("module_cases")
    .select("id, test_case_id, test_cases(*)")
    .eq("module_id", id);

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
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">
          {mod.seq_number && (
            <span className="text-gray-400 font-normal mr-2">
              {formatId("M", mod.seq_number)}
            </span>
          )}
          {mod.name}
        </h1>
        <Badge
          className={
            mod.archived_at
              ? "bg-gray-200 text-gray-600"
              : "bg-green-100 text-green-700"
          }
        >
          {mod.archived_at ? "Archived" : "Active"}
        </Badge>
      </div>
      <p className="text-gray-600 mt-1 mb-6">{mod.description}</p>

      <h2 className="font-semibold mb-2">Test Cases in this Module</h2>
      {linkedCases.length === 0 ? (
        <p className="text-gray-500 mb-6">None yet.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {linkedCases.map((lc) => (
            <li
              key={lc.test_case_id}
              className="border rounded p-2 flex justify-between items-center"
            >
              <span>
                {lc.test_cases.seq_number && (
                  <span className="text-gray-400 mr-2">
                    {formatId("TC", lc.test_cases.seq_number)}
                  </span>
                )}
                {lc.test_cases.title}
              </span>
              <form action={removeTestCaseFromModule}>
                <input type="hidden" name="moduleCaseId" value={lc.id} />
                <input type="hidden" name="moduleId" value={mod.id} />
                <Button type="submit" variant="ghostDanger">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-semibold mb-2">Add More Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-gray-500">
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
