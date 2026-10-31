"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIdParam } from "@/lib/params";
import { readNameForm, validateNameForm } from "@/lib/nameValidation";
import { FIX_FIELDS_MESSAGE, formFailure, formSuccess } from "@/lib/formState";
import { getCurrentRole } from "@/lib/currentRole";

const CODE_PATTERN = /^[A-Z0-9]{2,10}$/;
const NOT_ADMIN_MESSAGE = "Only admins can manage projects.";

function readProjectForm(formData) {
  const code = formData.get("code");
  return {
    ...readNameForm(formData),
    code: typeof code === "string" ? code.trim().toUpperCase() : "",
  };
}

export async function createProject(prevState, formData) {
  const values = readProjectForm(formData);
  const supabase = await createClient();

  if ((await getCurrentRole(supabase)) !== "admin") {
    return formFailure(prevState, values, { error: NOT_ADMIN_MESSAGE });
  }

  const fieldErrors = validateNameForm(values, "Project");
  if (!values.code) {
    fieldErrors.code = "Project code is required.";
  } else if (!CODE_PATTERN.test(values.code)) {
    fieldErrors.code = "Use 2–10 letters or digits, with no spaces.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const { error } = await supabase.from("projects").insert({
    code: values.code,
    name: values.name,
    description: values.description || null,
  });
  if (error) {
    if (error.code === "23505") {
      return formFailure(prevState, values, {
        error: FIX_FIELDS_MESSAGE,
        fieldErrors: { code: "That code is already in use." },
      });
    }
    return formFailure(prevState, values, {
      error: `Could not create the project: ${error.message}`,
    });
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(prevState, formData) {
  const values = readNameForm(formData);
  const projectId = parseIdParam(formData.get("projectId"));
  const supabase = await createClient();

  if ((await getCurrentRole(supabase)) !== "admin") {
    return formFailure(prevState, values, { error: NOT_ADMIN_MESSAGE });
  }
  if (!projectId) {
    return formFailure(prevState, values, {
      error:
        "This project could not be identified. Reload the page and try again.",
    });
  }

  const fieldErrors = validateNameForm(values, "Project");
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  // The code is never sent: it cannot be changed (the database enforces it too).
  const { data: updated, error } = await supabase
    .from("projects")
    .update({ name: values.name, description: values.description || null })
    .eq("id", projectId)
    .select("id");
  if (error) {
    return formFailure(prevState, values, {
      error: `Could not save changes: ${error.message}`,
    });
  }
  if (!updated || updated.length === 0) {
    return formFailure(prevState, values, {
      error: "This project no longer exists.",
    });
  }

  revalidatePath("/projects");
  return formSuccess(prevState, values, "Changes saved.");
}

async function setArchived(formData, archivedAt) {
  const supabase = await createClient();
  if ((await getCurrentRole(supabase)) !== "admin") {
    throw new Error(NOT_ADMIN_MESSAGE);
  }

  const projectId = parseIdParam(formData.get("projectId"));
  if (!projectId) throw new Error("This project could not be identified.");

  const { error } = await supabase
    .from("projects")
    .update({ archived_at: archivedAt })
    .eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
}

export async function archiveProject(formData) {
  await setArchived(formData, new Date().toISOString());
}

export async function restoreProject(formData) {
  await setArchived(formData, null);
}
