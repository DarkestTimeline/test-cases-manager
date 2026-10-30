"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIdParam } from "@/lib/params";
import { readNameForm, validateNameForm } from "@/lib/nameValidation";
import { FIX_FIELDS_MESSAGE, formFailure, formSuccess } from "@/lib/formState";

export async function createSuite(prevState, formData) {
  const values = readNameForm(formData);
  const fieldErrors = validateNameForm(values, "Suite");
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: suite, error } = await supabase
    .from("suites")
    .insert({ name: values.name, description: values.description || null })
    .select("id")
    .single();
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not create the suite: ${error.message}`,
    });
  }

  revalidatePath("/suites");
  redirect(`/suites/${suite.id}`);
}

export async function updateSuite(prevState, formData) {
  const values = readNameForm(formData);
  const suiteId = parseIdParam(formData.get("suiteId"));
  if (!suiteId) {
    return formFailure(prevState, values, {
      error:
        "This suite could not be identified. Reload the page and try again.",
    });
  }

  const fieldErrors = validateNameForm(values, "Suite");
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("suites")
    .update({ name: values.name, description: values.description || null })
    .eq("id", suiteId)
    .select("id");
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not save changes: ${error.message}`,
    });
  }
  if (!updated || updated.length === 0) {
    return formFailure(prevState, values, {
      error: "This suite no longer exists.",
    });
  }

  revalidatePath("/suites");
  revalidatePath(`/suites/${suiteId}`);
  return formSuccess(prevState, values, "Changes saved.");
}

export async function archiveSuite(formData) {
  const supabase = await createClient();
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suites")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", suiteId);
  if (error) throw new Error(error.message);

  revalidatePath("/suites");
}

export async function restoreSuite(formData) {
  const supabase = await createClient();
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suites")
    .update({ archived_at: null })
    .eq("id", suiteId);
  if (error) throw new Error(error.message);

  revalidatePath("/suites");
}

export async function cloneSuite(formData) {
  const supabase = await createClient();
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

export async function addTestCasesToSuite(formData) {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const suiteCaseId = formData.get("suiteCaseId");
  const suiteId = formData.get("suiteId");

  const { error } = await supabase
    .from("suite_cases")
    .delete()
    .eq("id", suiteCaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/suites/${suiteId}`);
}

export async function reorderSuiteCases(suiteId, orderedIds) {
  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("suite_cases").update({ position: index }).eq("id", id),
  );
  await Promise.all(updates);

  revalidatePath(`/suites/${suiteId}`);
}
