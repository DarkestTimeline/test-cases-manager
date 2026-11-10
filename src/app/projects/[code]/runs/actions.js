"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatId } from "@/lib/displayId";
import { findProjectByCode } from "@/lib/projectAction";
import { blockIdsIn, cleanSteps, expandSteps, normalizeSteps } from "@/lib/steps";
import { fetchBlocksById } from "@/lib/stepBlocks";

const LIST_PATH = "/projects/[code]/runs";
const RUN_PATH = "/projects/[code]/runs/[id]";

// Active suites of a project, for the "Start a run" dialog.
export async function getProjectSuites(projectCode) {
  const supabase = await createClient();
  const project = await findProjectByCode(supabase, projectCode);
  if (!project) {
    return { error: "This project is archived or no longer exists." };
  }

  const { data, error } = await supabase
    .from("suites")
    .select("id, name")
    .eq("project_id", project.id)
    .is("archived_at", null)
    .order("name");
  if (error) return { error: error.message };

  return { suites: data };
}

export async function startRun(formData) {
  const supabase = await createClient();
  const suiteId = formData.get("suiteId");
  const os = formData.get("os");
  const buildVersion = formData.get("build_version");

  // The run belongs to the same project as its suite.
  const { data: suite, error: suiteError } = await supabase
    .from("suites")
    .select("project_id, projects(code)")
    .eq("id", suiteId)
    .single();
  if (suiteError || !suite) throw new Error("That suite could not be found.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: run, error: runError } = await supabase
    .from("test_runs")
    .insert({
      project_id: suite.project_id,
      suite_id: suiteId,
      tester_name: profile?.display_name || user.email,
      started_by: user.id,
      os,
      build_version: buildVersion,
    })
    .select()
    .single();

  if (runError) throw new Error(runError.message);

  const { data: linkedCases, error: linkedError } = await supabase
    .from("suite_cases")
    .select("test_cases(*)")
    .eq("suite_id", suiteId)
    .order("position");

  if (linkedError) throw new Error(linkedError.message);

  // Step Block references are expanded into plain steps right now, so the run
  // keeps the steps as they are at this moment, whatever happens to the blocks
  // (or the test cases) later.
  const caseSteps = linkedCases.map((lc) =>
    normalizeSteps(cleanSteps(lc.test_cases.steps)),
  );
  const blockIds = [...new Set(caseSteps.flatMap((steps) => blockIdsIn(steps)))];
  const { byId: blocksById, error: blocksError } = await fetchBlocksById(
    supabase,
    suite.project_id,
    blockIds,
  );
  if (blocksError) throw new Error(blocksError.message);

  const resultsToInsert = linkedCases.map((lc, index) => ({
    test_run_id: run.id,
    test_case_id: lc.test_cases.id,
    title: lc.test_cases.title,
    steps: expandSteps(caseSteps[index], blocksById, { withMeta: true }),
    test_case_code: formatId(suite.projects.code, lc.test_cases.seq_number),
    position: index,
  }));

  const { error: resultsError } = await supabase
    .from("run_results")
    .insert(resultsToInsert);
  if (resultsError) throw new Error(resultsError.message);

  redirect(`/projects/${suite.projects.code}/runs/${run.id}`);
}

export async function completeRun(formData) {
  const supabase = await createClient();
  const runId = formData.get("runId");
  const outcome = formData.get("outcome");

  const { data: run } = await supabase
    .from("test_runs")
    .select("status")
    .eq("id", runId)
    .single();
  if (run?.status !== "in_progress")
    throw new Error("This run is not in progress and cannot be completed.");

  const { count: pendingCount } = await supabase
    .from("run_results")
    .select("*", { count: "exact", head: true })
    .eq("test_run_id", runId)
    .eq("status", "pending");

  if (pendingCount > 0)
    throw new Error("Cannot complete a run with pending test cases.");

  const { error } = await supabase
    .from("test_runs")
    .update({
      status: "completed",
      outcome,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(error.message);

  revalidatePath(RUN_PATH, "page");
  revalidatePath(LIST_PATH, "page");
}

export async function cancelRun(formData) {
  const supabase = await createClient();
  const runId = formData.get("runId");

  const { data: run } = await supabase
    .from("test_runs")
    .select("status")
    .eq("id", runId)
    .single();
  if (run?.status !== "in_progress")
    throw new Error("This run is not in progress and cannot be cancelled.");

  const { error } = await supabase
    .from("test_runs")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw new Error(error.message);

  revalidatePath(RUN_PATH, "page");
  revalidatePath(LIST_PATH, "page");
}

export async function updateResult({ resultId, status, notes, runId }) {
  const supabase = await createClient();
  const { data: run } = await supabase
    .from("test_runs")
    .select("status")
    .eq("id", runId)
    .single();
  if (run?.status !== "in_progress")
    throw new Error("This run is locked and cannot be edited.");

  const { error } = await supabase
    .from("run_results")
    .update({ status, notes })
    .eq("id", resultId);
  if (error) throw new Error(error.message);

  revalidatePath(RUN_PATH, "page");
}
