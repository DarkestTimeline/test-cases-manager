import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProjectCode } from "@/lib/params";

// Resolves the project named in the URL (case-insensitive). Calls notFound()
// for an unknown code. Cached per request, so the layout and the page share
// one lookup.
export const getProject = cache(async (code) => {
  const parsed = parseProjectCode(code);
  if (!parsed) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, code, name, description, archived_at")
    .eq("code", parsed)
    .maybeSingle();
  if (!data) notFound();

  return data;
});

// Active projects, for pickers such as "Clone to project". Cached per request.
export const getActiveProjects = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("code, name")
    .is("archived_at", null)
    .order("name");
  return data || [];
});
