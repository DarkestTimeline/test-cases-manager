import { supabase } from "@/lib/supabaseClient";
import { addTestCasesToSuite, updateSuite, cloneSuite } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import SortableSuiteCases from "./SortableSuiteCases";
import BackLink from "@/components/BackLink";

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
      if (!grouped[mod.id]) grouped[mod.id] = { module: mod, cases: [] };
      grouped[mod.id].cases.push(tc);
    } else {
      ungrouped.push(tc);
    }
  });
  const moduleGroups = Object.values(grouped);

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <BackLink href="/suites" label="Suites" />
      <div className="flex items-center gap-2 mb-4">
        <Badge
          className={
            suite.archived_at
              ? "bg-slate-200 text-slate-600"
              : "bg-emerald-100 text-emerald-700"
          }
        ></Badge>
        {suite.seq_number && (
          <span className="text-slate-400 text-sm">
            {formatId("S", suite.seq_number)}
          </span>
        )}
        <form action={cloneSuite}>
          <input type="hidden" name="suiteId" value={suite.id} />
          <Button type="submit" variant="secondary" size="sm">
            Clone
          </Button>
        </form>
      </div>

      <form action={updateSuite} className="space-y-3 mb-8 border-b pb-6">
        <input type="hidden" name="suiteId" value={suite.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={suite.name}
            required
            className="w-full border rounded p-2 text-2xl font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={suite.description}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>

      <h2 className="mb-2">Test Cases in this Suite</h2>
      <SortableSuiteCases linkedCases={linkedCases} suiteId={suite.id} />

      {moduleGroups.length > 0 && (
        <>
          <h2 className="mb-2">Quick Add by Module</h2>
          <div className="space-y-2 mb-6">
            {moduleGroups.map((group) => (
              <div key={group.module.id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
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
                    <Button type="submit" variant="success" size="sm">
                      Add All
                    </Button>
                  </form>
                </div>
                <ul className="mt-2 text-xs text-slate-500 list-disc list-inside space-y-0.5">
                  {group.cases.map((tc) => (
                    <li key={tc.id}>
                      {tc.seq_number && (
                        <span className="text-slate-400">
                          {formatId("TC", tc.seq_number)}{" "}
                        </span>
                      )}
                      {tc.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2">Add Individual Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-slate-500">
          All test cases are already in this suite.
        </p>
      ) : (
        <form action={addTestCasesToSuite} className="space-y-4">
          <input type="hidden" name="suiteId" value={suite.id} />
          {moduleGroups.map((group) => (
            <div key={group.module.id}>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {group.module.name}
              </p>
              <div className="space-y-1">
                {group.cases.map((tc) => (
                  <label
                    key={tc.id}
                    className="flex items-center gap-2 border rounded p-2"
                  >
                    <input type="checkbox" name="testCaseIds" value={tc.id} />
                    {tc.title}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                No Module
              </p>
              <div className="space-y-1">
                {ungrouped.map((tc) => (
                  <label
                    key={tc.id}
                    className="flex items-center gap-2 border rounded p-2"
                  >
                    <input type="checkbox" name="testCaseIds" value={tc.id} />
                    {tc.title}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit">Add Selected</Button>
        </form>
      )}
    </main>
  );
}
