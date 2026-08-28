"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSuite(formData) {
  const name = formData.get("name");
  const description = formData.get("description");

  const { data: suite, error } = await supabase
    .from("suites")
    .insert({ name, description })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/suites");
  redirect(`/suites/${suite.id}`);
}

export async function addTestCasesToSuite(formData) {
  const suiteId = formData.get("suiteId");
  const testCaseIds = formData.getAll("testCaseIds");

  if (testCaseIds.length === 0) return;

  const { data: existing } = await supabase
    .from("suite_cases")
    .select("position")
    .eq("suite_id", suiteId)
    .order("position", { ascending: false })
    .limit(1);

  const startPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const rowsToInsert = testCaseIds.map((testCaseId, index) => ({
    suite_id: suiteId,
    test_case_id: testCaseId,
    position: startPosition + index,
  }));

  const { error } = await supabase.from("suite_cases").insert(rowsToInsert);

  if (error) throw new Error(error.message);

  revalidatePath(`/suites/${suiteId}`);
}

export async function removeTestCaseFromSuite(formData) {
  const suiteCaseId = formData.get("suiteCaseId");
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suite_cases")
    .delete()
    .eq("id", suiteCaseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/suites/${suiteId}`);
}

export async function archiveSuite(formData) {
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suites")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", suiteId);

  if (error) throw new Error(error.message);

  revalidatePath("/suites");
}

export async function restoreSuite(formData) {
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suites")
    .update({ archived_at: null })
    .eq("id", suiteId);

  if (error) throw new Error(error.message);

  revalidatePath("/suites");
}

export async function updateSuite(formData) {
  const suiteId = formData.get("suiteId");
  const name = formData.get("name");
  const description = formData.get("description");

  const { error } = await supabase
    .from("suites")
    .update({ name, description })
    .eq("id", suiteId);

  if (error) throw new Error(error.message);

  revalidatePath("/suites");
  revalidatePath(`/suites/${suiteId}`);
}

export async function reorderSuiteCases(suiteId, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase.from("suite_cases").update({ position: index }).eq("id", id),
  );

  await Promise.all(updates);

  revalidatePath(`/suites/${suiteId}`);
}

export async function cloneSuite(formData) {
  const suiteId = formData.get("suiteId");

  const { data: source } = await supabase
    .from("suites")
    .select("*")
    .eq("id", suiteId)
    .single();

  const { data: clone, error } = await supabase
    .from("suites")
    .insert({ name: `${source.name} (Copy)`, description: source.description })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: sourceCases } = await supabase
    .from("suite_cases")
    .select("test_case_id")
    .eq("suite_id", suiteId)
    .order("position");

  if (sourceCases.length > 0) {
    const rowsToInsert = sourceCases.map((sc, index) => ({
      suite_id: clone.id,
      test_case_id: sc.test_case_id,
      position: index,
    }));

    const { error: insertError } = await supabase
      .from("suite_cases")
      .insert(rowsToInsert);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/suites");
  redirect(`/suites/${clone.id}`);
}
