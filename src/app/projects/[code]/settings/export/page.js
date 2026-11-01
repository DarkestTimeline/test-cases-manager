import { createClient } from '@/lib/supabase/server'
import { getProject } from "@/lib/project";
import ExportTestCases from "./ExportTestCases";

export default async function ExportPage({ params }) {
  const { code } = await params;
  const project = await getProject(code);
  const supabase = await createClient();
  const { data: suites } = await supabase
    .from("suites")
    .select("id, name")
    .eq("project_id", project.id)
    .is("archived_at", null)
    .order("name");
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .eq("project_id", project.id)
    .is("archived_at", null)
    .order("name");

  return (
    <ExportTestCases
      projectCode={project.code}
      suites={suites || []}
      modules={modules || []}
    />
  );
}
