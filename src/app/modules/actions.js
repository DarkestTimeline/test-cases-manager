"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIdParam } from "@/lib/params";
import { readNameForm, validateNameForm } from "@/lib/nameValidation";
import { FIX_FIELDS_MESSAGE, formFailure, formSuccess } from "@/lib/formState";

export async function createModule(prevState, formData) {
  const values = readNameForm(formData);
  const fieldErrors = validateNameForm(values, "Module");
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: mod, error } = await supabase
    .from("modules")
    .insert({ name: values.name, description: values.description || null })
    .select("id")
    .single();
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not create the module: ${error.message}`,
    });
  }

  revalidatePath("/modules");
  redirect(`/modules/${mod.id}`);
}

export async function updateModule(prevState, formData) {
  const values = readNameForm(formData);
  const moduleId = parseIdParam(formData.get("moduleId"));
  if (!moduleId) {
    return formFailure(prevState, values, {
      error:
        "This module could not be identified. Reload the page and try again.",
    });
  }

  const fieldErrors = validateNameForm(values, "Module");
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("modules")
    .update({ name: values.name, description: values.description || null })
    .eq("id", moduleId)
    .select("id");
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not save changes: ${error.message}`,
    });
  }
  if (!updated || updated.length === 0) {
    return formFailure(prevState, values, {
      error: "This module no longer exists.",
    });
  }

  revalidatePath("/modules");
  revalidatePath(`/modules/${moduleId}`);
  return formSuccess(prevState, values, "Changes saved.");
}

export async function archiveModule(formData) {
  const supabase = await createClient();
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("modules")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath("/modules");
}

export async function restoreModule(formData) {
  const supabase = await createClient();
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("modules")
    .update({ archived_at: null })
    .eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath("/modules");
}

export async function cloneModule(formData) {
  const supabase = await createClient();
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

export async function addTestCasesToModule(formData) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const moduleCaseId = formData.get("moduleCaseId");
  const moduleId = formData.get("moduleId");

  const { error } = await supabase
    .from("module_cases")
    .delete()
    .eq("id", moduleCaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/modules/${moduleId}`);
}

export async function reorderModuleCases(moduleId, orderedIds) {
  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("module_cases").update({ position: index }).eq("id", id),
  );
  await Promise.all(updates);

  revalidatePath(`/modules/${moduleId}`);
}
