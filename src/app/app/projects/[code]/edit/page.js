import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/currentRole";
import { parseProjectCode } from "@/lib/params";
import { updateProject } from "../../actions";
import ProjectForm from "@/components/ProjectForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";

export default async function EditProject({ params }) {
  const { code } = await params;
  const projectCode = parseProjectCode(code);
  if (!projectCode) notFound();

  const supabase = await createClient();
  if ((await getCurrentRole(supabase)) !== "admin") redirect("/projects");

  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name, description")
    .eq("code", projectCode)
    .maybeSingle();
  if (!project) notFound();

  return (
    <main className={PAGE.standard}>
      <BackLink href="/projects" label="Projects" />
      <h1 className="mb-6">Edit Project</h1>
      <ProjectForm
        action={updateProject}
        hiddenFields={{ projectId: project.id }}
        lockedCode={project.code}
        initialValues={{
          code: project.code,
          name: project.name,
          description: project.description ?? "",
        }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
      />
    </main>
  );
}
