import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/currentRole";
import { createProject } from "../actions";
import ProjectForm from "@/components/ProjectForm";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";

export default async function NewProject() {
  const supabase = await createClient();
  if ((await getCurrentRole(supabase)) !== "admin") redirect("/projects");

  return (
    <main className={PAGE.standard}>
      <BackLink href="/projects" label="Projects" />
      <h1 className="mb-6">New Project</h1>
      <ProjectForm
        action={createProject}
        initialValues={{ code: "", name: "", description: "" }}
        submitLabel="Create Project"
        pendingLabel="Creating..."
      />
    </main>
  );
}
