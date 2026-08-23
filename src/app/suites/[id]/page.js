import { supabase } from "@/lib/supabaseClient";
import { formatId } from "@/lib/displayId";
import { addTestCasesToSuite } from "../actions";
import SortableSuiteCases from "./SortableSuiteCases";

export default async function SuiteDetail({ params }) {
  const { id } = await params;

  const { data: suite } = await supabase
    .from("suites")
    .select("*")
    .eq("id", id)
    .single();

  const { data: linkedCases } = await supabase
    .from("suite_cases")
    .select("id, test_case_id, position, test_cases(*)")
    .eq("suite_id", id)
    .order("position");

  const { data: allTestCases } = await supabase
    .from("test_cases")
    .select("*")
    .is("archived_at", null);

  const { data: moduleCasesRaw } = await supabase
    .from("module_cases")
    .select("test_case_id, modules(id, name, archived_at)");

  const moduleCases = moduleCasesRaw.filter(
    (mc) => mc.modules && !mc.modules.archived_at,
  );

  const linkedIds = linkedCases.map((lc) => lc.test_case_id);
  const availableTestCases = allTestCases.filter(
    (tc) => !linkedIds.includes(tc.id),
  );

  const moduleByTestCaseId = {};
  moduleCases.forEach((mc) => {
    moduleByTestCaseId[mc.test_case_id] = mc.modules;
  });

  const grouped = {};
  const ungrouped = [];

  availableTestCases.forEach((tc) => {
    const mod = moduleByTestCaseId[tc.id];
    if (mod) {
      if (!grouped[mod.id]) {
        grouped[mod.id] = { module: mod, cases: [] };
      }
      grouped[mod.id].cases.push(tc);
    } else {
      ungrouped.push(tc);
    }
  });

  const moduleGroups = Object.values(grouped);

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="">
          {suite.seq_number && (
            <span className="text-gray-400 font-normal mr-2">
              {formatId("S", suite.seq_number)}
            </span>
          )}
          {suite.name}
        </h1>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${suite.archived_at ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"}`}
        >
          {suite.archived_at ? "Archived" : "Active"}
        </span>
      </div>
      <p className="text-gray-600 mt-1 mb-6">{suite.description}</p>

      <h2 className=" mb-2">Test Cases in this Suite</h2>
      <SortableSuiteCases linkedCases={linkedCases} suiteId={suite.id} />

      {moduleGroups.length > 0 && (
        <>
          <h2 className="mb-2">Quick Add by Module</h2>
          <div className="space-y-2 mb-6">
            {moduleGroups.map((group) => (
              <div
                key={group.module.id}
                className="flex justify-between items-center border rounded p-2"
              >
                <span className="text-sm">
                  {group.module.name} ({group.cases.length} test case
                  {group.cases.length !== 1 ? "s" : ""})
                </span>
                <form action={addTestCasesToSuite}>
                  <input type="hidden" name="suiteId" value={suite.id} />
                  {group.cases.map((tc) => (
                    <input
                      key={tc.id}
                      type="hidden"
                      name="testCaseIds"
                      value={tc.id}
                    />
                  ))}
                  <button
                    type="submit"
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Add All
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2">Add Individual Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-gray-500">
          All test cases are already in this suite.
        </p>
      ) : (
        <form action={addTestCasesToSuite} className="space-y-4">
          <input type="hidden" name="suiteId" value={suite.id} />

          {moduleGroups.map((group) => (
            <div key={group.module.id}>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {group.module.name}
              </p>
              <div className="space-y-1">
                {group.cases.map((tc) => (
                  <label
                    key={tc.id}
                    className="flex items-center gap-2 border rounded p-2"
                  >
                    <input type="checkbox" name="testCaseIds" value={tc.id} />
                    {tc.seq_number && (
                      <span className="text-gray-400 mr-2">
                        {formatId("TC", tc.seq_number)}
                      </span>
                    )}
                    {tc.title}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                No Module
              </p>
              <div className="space-y-1">
                {ungrouped.map((tc) => (
                  <label
                    key={tc.id}
                    className="flex items-center gap-2 border rounded p-2"
                  >
                    <input type="checkbox" name="testCaseIds" value={tc.id} />
                    {tc.seq_number && (
                      <span className="text-gray-400 mr-2">
                        {formatId("TC", tc.seq_number)}
                      </span>
                    )}
                    {tc.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Selected
          </button>
        </form>
      )}
    </main>
  );
}
