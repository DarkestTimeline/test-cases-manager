"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateRow } from "@/lib/testCaseValidation";

export async function createTestCase(formData) {
  const title = formData.get("title");
  const preconditions = formData.get("preconditions");
  const steps_to_reproduce = formData.get("steps_to_reproduce");
  const expected_result = formData.get("expected_result");
  const moduleIds = formData.getAll("moduleIds");

  const { data: testCase, error } = await supabase
    .from("test_cases")
    .insert({ title, preconditions, steps_to_reproduce, expected_result })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (moduleIds.length > 0) {
    const rowsToInsert = moduleIds.map((moduleId) => ({
      module_id: moduleId,
      test_case_id: testCase.id,
    }));

    const { error: moduleError } = await supabase
      .from("module_cases")
      .insert(rowsToInsert);

    if (moduleError) {
      throw new Error(moduleError.message);
    }
  }

  revalidatePath("/test-cases");
  redirect("/test-cases");
}

export async function archiveTestCase(formData) {
  const testCaseId = formData.get("testCaseId");

  const { error } = await supabase
    .from("test_cases")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", testCaseId);

  if (error) throw new Error(error.message);

  revalidatePath("/test-cases");
}

export async function restoreTestCase(formData) {
  const testCaseId = formData.get("testCaseId");

  const { error } = await supabase
    .from("test_cases")
    .update({ archived_at: null })
    .eq("id", testCaseId);

  if (error) throw new Error(error.message);

  revalidatePath("/test-cases");
}

export async function updateTestCase(formData) {
  const testCaseId = formData.get("testCaseId");
  const title = formData.get("title");
  const preconditions = formData.get("preconditions");
  const steps_to_reproduce = formData.get("steps_to_reproduce");
  const expected_result = formData.get("expected_result");
  const moduleIds = formData.getAll("moduleIds");

  const { error } = await supabase
    .from("test_cases")
    .update({ title, preconditions, steps_to_reproduce, expected_result })
    .eq("id", testCaseId);

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("module_cases")
    .delete()
    .eq("test_case_id", testCaseId);

  if (deleteError) throw new Error(deleteError.message);

  if (moduleIds.length > 0) {
    const rowsToInsert = moduleIds.map((moduleId) => ({
      module_id: moduleId,
      test_case_id: testCaseId,
    }));

    const { error: insertError } = await supabase
      .from("module_cases")
      .insert(rowsToInsert);

    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/test-cases");
  redirect("/test-cases");
}

export async function cloneTestCase(formData) {
  const testCaseId = formData.get("testCaseId");

  const { data: source } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", testCaseId)
    .single();

  const { data: clone, error } = await supabase
    .from("test_cases")
    .insert({
      title: `${source.title} (Copy)`,
      preconditions: source.preconditions,
      steps_to_reproduce: source.steps_to_reproduce,
      expected_result: source.expected_result,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: moduleLinks } = await supabase
    .from("module_cases")
    .select("module_id")
    .eq("test_case_id", testCaseId);

  for (const link of moduleLinks) {
    const { data: existing } = await supabase
      .from("module_cases")
      .select("position")
      .eq("module_id", link.module_id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      existing && existing.length > 0 ? existing[0].position + 1 : 0;

    await supabase.from("module_cases").insert({
      module_id: link.module_id,
      test_case_id: clone.id,
      position: nextPosition,
    });
  }

  revalidatePath("/test-cases");
  redirect(`/test-cases/${clone.id}/edit`);
}

export async function importTestCases(rows) {
  const invalidRows = rows.filter((row) => validateRow(row).length > 0);

  if (invalidRows.length > 0) {
    throw new Error(
      `Cannot import: ${invalidRows.length} row(s) still have missing required fields.`,
    );
  }

  const rowsToInsert = rows.map((row) => ({
    title: row.title,
    preconditions: row.preconditions || null,
    steps_to_reproduce: row.steps_to_reproduce,
    expected_result: row.expected_result,
  }));

  const { error } = await supabase.from("test_cases").insert(rowsToInsert);

  if (error) throw new Error(error.message);

  revalidatePath("/test-cases");

  return { importedCount: rowsToInsert.length };
}
