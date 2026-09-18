import { createClient } from "@/lib/supabase/server";
import { addTestCasesToSuite, updateSuite, cloneSuite } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import SortableSuiteCases from "./SortableSuiteCases";
import AddTestCasesPicker from "@/components/AddTestCasesPicker";

export default async function SuiteDetail({ params }) {
  const { id } = await params;
  const supabase = await createClient();

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
        >
          {suite.archived_at ? "Archived" : "Active"}
        </Badge>
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

      <h2 className="mb-2 mt-6">Add Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-slate-500">
          All test cases are already in this suite.
        </p>
      ) : (
        <form action={addTestCasesToSuite} className="space-y-4">
          <input type="hidden" name="suiteId" value={suite.id} />
          <AddTestCasesPicker
            moduleGroups={moduleGroups}
            ungrouped={ungrouped}
          />
          <Button type="submit">Add Selected</Button>
        </form>
      )}
    </main>
  );
}
