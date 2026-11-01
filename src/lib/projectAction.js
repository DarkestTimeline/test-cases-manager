import { parseProjectCode } from "@/lib/params";

export const PROJECT_UNAVAILABLE_MESSAGE =
  "This project is archived or no longer exists. Reload the page and try again.";

// Looks a project up by code for server actions. Returns null when the code
// is invalid or unknown, or the project is archived (unless allowArchived).
export async function findProjectByCode(
  supabase,
  rawCode,
  { allowArchived = false } = {},
) {
  const code = parseProjectCode(rawCode);
  if (!code) return null;

  const { data } = await supabase
    .from("projects")
    .select("id, code, archived_at")
    .eq("code", code)
    .maybeSingle();
  if (!data || (data.archived_at && !allowArchived)) return null;

  return data;
}

// Same, reading the code from a form's hidden "projectCode" field.
export function findProject(supabase, formData, options) {
  return findProjectByCode(supabase, formData.get("projectCode"), options);
}
