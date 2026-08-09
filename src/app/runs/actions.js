"use server";

import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function startRun(formData) {
  const suiteId = formData.get("suiteId");
  const testerName = formData.get("testerName");
  const os = formData.get("os");
  const buildVersion = formData.get("build_version");

  // Step 1: create the run itself
  const { data: run, error: runError } = await supabase
    .from("test_runs")
    .insert({
      suite_id: suiteId,
      tester_name: testerName,
      os,
      build_version: buildVersion,
    })
    .select()
    .single();

  if (runError) throw new Error(runError.message);

  // Step 2: find every test case linked to this suite
  const { data: linkedCases, error: linkedError } = await supabase
    .from("suite_cases")
    .select("test_cases(*)")
    .eq("suite_id", suiteId);

  if (linkedError) throw new Error(linkedError.message);

  // Step 3: snapshot each one into run_results, tied to this run
  const resultsToInsert = linkedCases.map((lc) => ({
    test_run_id: run.id,
    test_case_id: lc.test_cases.id,
    title: lc.test_cases.title,
    steps_to_reproduce: lc.test_cases.steps_to_reproduce,
    expected_result: lc.test_cases.expected_result,
  }));

  const { error: resultsError } = await supabase
    .from("run_results")
    .insert(resultsToInsert);

  if (resultsError) throw new Error(resultsError.message);

  redirect(`/runs/${run.id}`);
}

export async function updateResult({ resultId, status, notes, runId }) {
  const { error } = await supabase
    .from("run_results")
    .update({ status, notes })
    .eq("id", resultId);

  if (error) throw new Error(error.message);

  revalidatePath(`/runs/${runId}`);
}

export async function completeRun(formData) {
  const runId = formData.get("runId");
  const outcome = formData.get("outcome");

  const { count: pendingCount } = await supabase
    .from("run_results")
    .select("*", { count: "exact", head: true })
    .eq("test_run_id", runId)
    .eq("status", "pending");

  if (pendingCount > 0) {
    throw new Error("Cannot complete a run with pending test cases.");
  }

  const { error } = await supabase
    .from("test_runs")
    .update({
      status: "completed",
      outcome,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(error.message);

  revalidatePath(`/runs/${runId}`);
  revalidatePath("/runs");
}
