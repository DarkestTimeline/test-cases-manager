"use server";

import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createModule(formData) {
  const name = formData.get("name");
  const description = formData.get("description");

  const { data: suite, error } = await supabase
    .from("modules")
    .insert({ name, description })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/modules");
  redirect(`/modules/${suite.id}`);
}

export async function addTestCasesToModule(formData) {
  const moduleId = formData.get("moduleId");
  const testCaseIds = formData.getAll("testCaseIds");

  if (testCaseIds.length === 0) return;

  const { data: existing } = await supabase
    .from("module_cases")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1);

  const startPosition =
    existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const rowsToInsert = testCaseIds.map((testCaseId, index) => ({
    module_id: moduleId,
    test_case_id: testCaseId,
    position: startPosition + index,
  }));

  const { error } = await supabase.from("module_cases").insert(rowsToInsert);

  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleId}`);
}

export async function removeTestCaseFromModule(formData) {
  const moduleCaseId = formData.get("moduleCaseId");
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("module_cases")
    .delete()
    .eq("id", moduleCaseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleId}`);
}

export async function archiveModule(formData) {
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("modules")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/modules");
}

export async function restoreModule(formData) {
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("modules")
    .update({ archived_at: null })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/modules");
}

export async function updateModule(formData) {
  const moduleId = formData.get("moduleId");
  const name = formData.get("name");
  const description = formData.get("description");

  const { error } = await supabase
    .from("modules")
    .update({ name, description })
    .eq("id", moduleId);

  if (error) throw new Error(error.message);

  revalidatePath("/modules");
  revalidatePath(`/modules/${moduleId}`);
}

export async function reorderModuleCases(moduleId, orderedIds) {
  const updates = orderedIds.map((id, index) =>
    supabase.from("module_cases").update({ position: index }).eq("id", id),
  );

  await Promise.all(updates);

  revalidatePath(`/modules/${moduleId}`);
}

export async function cloneModule(formData) {
  const moduleId = formData.get("moduleId");

  const { data: source } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  const { data: clone, error } = await supabase
    .from("modules")
    .insert({ name: `${source.name} (Copy)`, description: source.description })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: sourceCases } = await supabase
    .from("module_cases")
    .select("test_case_id")
    .eq("module_id", moduleId)
    .order("position");

  if (sourceCases.length > 0) {
    const rowsToInsert = sourceCases.map((sc, index) => ({
      module_id: clone.id,
      test_case_id: sc.test_case_id,
      position: index,
    }));

    const { error: insertError } = await supabase
      .from("module_cases")
      .insert(rowsToInsert);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/modules");
  redirect(`/modules/${clone.id}`);
}
