"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIdParam } from "@/lib/params";
import { FIX_FIELDS_MESSAGE, formFailure, formSuccess } from "@/lib/formState";
import { findProject, PROJECT_UNAVAILABLE_MESSAGE } from "@/lib/projectAction";
import { readStepBlockForm, validateStepBlock } from "@/lib/stepBlockValidation";
import { normalizeSteps, stepsToText } from "@/lib/steps";
import { refreshStepsText } from "@/lib/stepBlocks";

const LIST_PATH = "/projects/[code]/step-blocks";
const DETAIL_PATH = "/projects/[code]/step-blocks/[id]";
const TEST_CASES_PATH = "/projects/[code]/test-cases";

export async function createStepBlock(prevState, formData) {
  const values = readStepBlockForm(formData);
  const fieldErrors = validateStepBlock(values);
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const project = await findProject(supabase, formData);
  if (!project) {
    return formFailure(prevState, values, {
      error: PROJECT_UNAVAILABLE_MESSAGE,
    });
  }

  const steps = normalizeSteps(values.steps);
  const { error } = await supabase.from("step_blocks").insert({
    project_id: project.id,
    title: values.title,
    steps,
    steps_text: stepsToText(steps),
  });
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not create the step block: ${error.message}`,
    });
  }

  revalidatePath(LIST_PATH, "page");
  redirect(`/projects/${project.code}/step-blocks`);
}

export async function updateStepBlock(prevState, formData) {
  const values = readStepBlockForm(formData);
  const stepBlockId = parseIdParam(formData.get("stepBlockId"));
  if (!stepBlockId) {
    return formFailure(prevState, values, {
      error:
        "This step block could not be identified. Reload the page and try again.",
    });
  }

  const fieldErrors = validateStepBlock(values);
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const project = await findProject(supabase, formData);
  if (!project) {
    return formFailure(prevState, values, {
      error: PROJECT_UNAVAILABLE_MESSAGE,
    });
  }

  const steps = normalizeSteps(values.steps);
  const { data: updated, error } = await supabase
    .from("step_blocks")
    .update({
      title: values.title,
      steps,
      steps_text: stepsToText(steps),
    })
    .eq("id", stepBlockId)
    .eq("project_id", project.id)
    .select("id");
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not save changes: ${error.message}`,
    });
  }
  if (!updated || updated.length === 0) {
    return formFailure(prevState, values, {
      error: "This step block no longer exists.",
    });
  }

  // Test cases that use this block search on its text: keep that up to date.
  const refreshError = await refreshStepsText(supabase, project.id, stepBlockId);

  revalidatePath(LIST_PATH, "page");
  revalidatePath(DETAIL_PATH, "page");
  revalidatePath(TEST_CASES_PATH, "page");
  return formSuccess(
    prevState,
    values,
    refreshError
      ? `Changes saved, but searching the test cases that use this block could not be updated: ${refreshError}`
      : "Changes saved.",
  );
}

export async function archiveStepBlock(formData) {
  const supabase = await createClient();
  const stepBlockId = formData.get("stepBlockId");

  const { error } = await supabase
    .from("step_blocks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", stepBlockId);
  if (error) throw new Error(error.message);

  revalidatePath(LIST_PATH, "page");
}

export async function restoreStepBlock(formData) {
  const supabase = await createClient();
  const stepBlockId = formData.get("stepBlockId");

  const { error } = await supabase
    .from("step_blocks")
    .update({ archived_at: null })
    .eq("id", stepBlockId);
  if (error) throw new Error(error.message);

  revalidatePath(LIST_PATH, "page");
}
