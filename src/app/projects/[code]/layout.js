import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/project";
import ProjectSidebar from "@/components/ProjectSidebar";

export default async function ProjectLayout({ children, params }) {
  const { code } = await params;
  const project = await getProject(code);
  const supabase = await createClient();

  const [{ data: suites }, { data: projects }] = await Promise.all([
    supabase
      .from("suites")
      .select("id, name")
      .eq("project_id", project.id)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("projects")
      .select("code, name")
      .is("archived_at", null)
      .order("name"),
  ]);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <ProjectSidebar
        project={{
          code: project.code,
          name: project.name,
          archived: Boolean(project.archived_at),
        }}
        projects={projects || []}
        suites={suites || []}
      />
      <div className="flex-1 min-w-0">
        {project.archived_at && (
          <p
            role="status"
            className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800"
          >
            This project is archived. You can still browse it, but new items
            cannot be added.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
