import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject, getActiveProjects } from "@/lib/project";
import CloneToProjectButton from "@/components/CloneToProjectButton";
import { parseIdParam } from "@/lib/params";
import { addTestCasesToModule, updateModule, cloneModule } from "../actions";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import BackLink from "@/components/BackLink";
import SortableModuleCases from "./SortableModuleCases";
import AddTestCasesPicker from "@/components/AddTestCasesPicker";
import { PAGE } from "@/lib/pageWidths";
import NameDescriptionForm from "@/components/NameDescriptionForm";

export default async function ModuleDetail({ params }) {
  const { code, id: rawId } = await params;
  const project = await getProject(code);
  const otherProjects = (await getActiveProjects()).filter(
    (p) => p.code !== project.code,
  );
  const id = parseIdParam(rawId);
  if (!id) notFound();
  const supabase = await createClient();

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!mod) notFound();

  const { data: linkedCases } = await supabase
    .from("module_cases")
    .select("id, test_case_id, position, test_cases(*)")
    .eq("module_id", id)
    .order("position");

  const { data: allTestCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("project_id", project.id)
    .is("archived_at", null);

  const linkedIds = linkedCases.map((lc) => lc.test_case_id);
  const availableTestCases = allTestCases.filter(
    (tc) => !linkedIds.includes(tc.id),
  );

  return (
    <main className={PAGE.standard}>
      <BackLink href={`/projects/${project.code}/modules`} label="Modules" />
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
        <CloneToProjectButton
          kind="module"
          id={mod.id}
          projects={otherProjects}
        />
      </div>

      <NameDescriptionForm
        action={updateModule}
        hiddenFields={{ moduleId: mod.id }}
        initialValues={{
          name: mod.name ?? "",
          description: mod.description ?? "",
        }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
        large
        className="space-y-3 mb-8 border-b pb-6"
      />

      <h2 className="mb-2">Test Cases in this Module</h2>
      <SortableModuleCases
        linkedCases={linkedCases}
        moduleId={mod.id}
        casePrefix={project.code}
      />

      <h2 className="mb-2 mt-6">Add Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-slate-500">
          All test cases are already in this module.
        </p>
      ) : (
        <form action={addTestCasesToModule} className="space-y-4">
          <input type="hidden" name="moduleId" value={mod.id} />
          <AddTestCasesPicker
            moduleGroups={[]}
            ungrouped={availableTestCases}
          />
          <Button type="submit">Add Selected</Button>
        </form>
      )}
    </main>
  );
}
