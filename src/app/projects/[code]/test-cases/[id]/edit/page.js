import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTestCase } from "../../actions";
import TestCaseForm from "../../TestCaseForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";
import { parseIdParam } from "@/lib/params";
import { DEFAULT_PRIORITY } from "@/lib/testCaseValidation";
import { getProject, getActiveProjects } from "@/lib/project";
import CloneToProjectButton from "@/components/CloneToProjectButton";

const NOTICES = {
  "modules-failed":
    "The test case was created, but its modules could not be saved. Tick them again and save.",
};

export default async function EditTestCase({ params, searchParams }) {
  const { code, id: rawId } = await params;
  const project = await getProject(code);
  const otherProjects = (await getActiveProjects()).filter(
    (p) => p.code !== project.code,
  );
  const { notice } = await searchParams;
  const id = parseIdParam(rawId);
  if (!id) notFound();

  const supabase = await createClient();
  const [{ data: testCase }, { data: modules }, { data: links }] =
    await Promise.all([
      supabase
        .from("test_cases")
        .select("*")
        .eq("id", id)
        .eq("project_id", project.id)
        .maybeSingle(),
      supabase
        .from("modules")
        .select("id, name")
        .eq("project_id", project.id)
        .is("archived_at", null)
        .order("name"),
      supabase.from("module_cases").select("module_id").eq("test_case_id", id),
    ]);
  if (!testCase) notFound();

  const noticeText =
    typeof notice === "string" && Object.hasOwn(NOTICES, notice)
      ? NOTICES[notice]
      : null;

  return (
    <main className={PAGE.standard}>
      <BackLink
        href={`/projects/${project.code}/test-cases`}
        label="Test Cases"
      />
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1>Edit Test Case</h1>
        <CloneToProjectButton
          kind="test_case"
          id={testCase.id}
          projects={otherProjects}
        />
      </div>
      {noticeText && (
        <p
          role="status"
          className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {noticeText}
        </p>
      )}
      <TestCaseForm
        action={updateTestCase}
        projectCode={project.code}
        testCaseId={testCase.id}
        modules={modules || []}
        initialValues={{
          title: testCase.title ?? "",
          preconditions: testCase.preconditions ?? "",
          steps_to_reproduce: testCase.steps_to_reproduce ?? "",
          expected_result: testCase.expected_result ?? "",
          priority: testCase.priority ?? DEFAULT_PRIORITY,
          moduleIds: (links || []).map((l) => l.module_id),
        }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
      />
    </main>
  );
}
