import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject, getActiveProjects } from "@/lib/project";
import CloneToProjectButton from "@/components/CloneToProjectButton";
import { parseIdParam } from "@/lib/params";
import { addTestCasesToSuite, updateSuite, cloneSuite } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import SortableSuiteCases from "./SortableSuiteCases";
import AddTestCasesPicker from "@/components/AddTestCasesPicker";
import { PAGE } from "@/lib/pageWidths";
import NameDescriptionForm from "@/components/NameDescriptionForm";

export default async function SuiteDetail({ params }) {
  const { code, id: rawId } = await params;
  const project = await getProject(code);
  const otherProjects = (await getActiveProjects()).filter(
    (p) => p.code !== project.code,
  );
  const id = parseIdParam(rawId);
  if (!id) notFound();
  const supabase = await createClient();

  const { data: suite } = await supabase
    .from("suites")
    .select("*")
    .eq("id", id)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!suite) notFound();

  const { data: linkedCases } = await supabase
    .from("suite_cases")
    .select("id, test_case_id, position, test_cases(*)")
    .eq("suite_id", id)
    .order("position");

  const { data: allTestCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("project_id", project.id)
    .is("archived_at", null);

  const { data: moduleCasesRaw } = await supabase
    .from("module_cases")
    .select("test_case_id, modules(id, name, archived_at)")
    .eq("project_id", project.id);

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
    <main className={PAGE.standard}>
      <BackLink href={`/projects/${project.code}/suites`} label="Suites" />
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
        <CloneToProjectButton
          kind="suite"
          id={suite.id}
          projects={otherProjects}
        />
      </div>

      <NameDescriptionForm
        action={updateSuite}
        hiddenFields={{ suiteId: suite.id }}
        initialValues={{
          name: suite.name ?? "",
          description: suite.description ?? "",
        }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
        large
        className="space-y-3 mb-8 border-b pb-6"
      />

      <h2 className="mb-2">Test Cases in this Suite</h2>
      <SortableSuiteCases
        linkedCases={linkedCases}
        suiteId={suite.id}
        casePrefix={project.code}
      />

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
