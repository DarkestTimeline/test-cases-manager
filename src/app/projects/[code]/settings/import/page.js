import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/project";
import ImportTestCases from "./ImportTestCases";

export default async function ImportPage({ params }) {
  const { code } = await params;
  const project = await getProject(code);
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .eq("project_id", project.id)
    .is("archived_at", null)
    .order("name");
  const { data: allModulesForWarnings } = await supabase
    .from("modules")
    .select("name, archived_at")
    .eq("project_id", project.id);

  return (
    <ImportTestCases
      projectCode={project.code}
      modules={modules || []}
      allModulesForWarnings={allModulesForWarnings || []}
    />
  );
}
