import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { PAGE } from "@/lib/pageWidths";
import { getCurrentRole } from "@/lib/currentRole";
import { archiveProject, restoreProject } from "./actions";

export const dynamic = "force-dynamic";

function countOf(embedded) {
  return embedded?.[0]?.count ?? 0;
}

function plural(count, singular) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProjectsPage({ searchParams }) {
  const supabase = await createClient();
  const { archived } = await searchParams;
  const showingArchived = archived === "true";

  // One query: counts of active cases/modules/suites and the most recent
  // run per project come back embedded in each project row.
  let query = supabase
    .from("projects")
    .select(
      "id, code, name, description, test_cases(count), modules(count), suites(count), test_runs(started_at)",
    )
    .is("test_cases.archived_at", null)
    .is("modules.archived_at", null)
    .is("suites.archived_at", null)
    .order("started_at", { referencedTable: "test_runs", ascending: false })
    .limit(1, { referencedTable: "test_runs" })
    .order("name");

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  const [role, { data: projects, error }] = await Promise.all([
    getCurrentRole(supabase),
    query,
  ]);
  const isAdmin = role === "admin";

  if (error) return <p className="p-8 text-red-600">Error: {error.message}</p>;

  return (
    <main className={PAGE.wide}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1>Projects</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            href={showingArchived ? "/projects" : "/projects?archived=true"}
            variant="secondary"
            size="sm"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Button>
          {isAdmin && <Button href="/projects/new">+ New Project</Button>}
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500">
          {showingArchived
            ? "No archived projects."
            : isAdmin
              ? "No projects yet. Create the first one to get started."
              : "No projects yet. Ask an admin to create one."}
        </p>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => {
            const lastRun = project.test_runs?.[0]?.started_at;
            return (
              <li key={project.id}>
                <Card className="flex justify-between items-start gap-3">
                  <Link href={`/projects/${project.code}`} className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-700 font-mono">
                        {project.code}
                      </Badge>
                      <span className="font-semibold">{project.name}</span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {project.description}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-2">
                      {plural(countOf(project.test_cases), "test case")} ·{" "}
                      {plural(countOf(project.modules), "module")} ·{" "}
                      {plural(countOf(project.suites), "suite")}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {lastRun
                        ? `Last run ${formatDate(lastRun)}`
                        : "No runs yet"}
                    </p>
                  </Link>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        href={`/projects/${project.code}/edit`}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <form
                        action={
                          showingArchived ? restoreProject : archiveProject
                        }
                      >
                        <input
                          type="hidden"
                          name="projectId"
                          value={project.id}
                        />
                        <Button
                          type="submit"
                          variant={showingArchived ? "success" : "secondary"}
                          size="sm"
                        >
                          {showingArchived ? "Restore" : "Archive"}
                        </Button>
                      </form>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
