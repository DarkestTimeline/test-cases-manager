import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/Button";
import { getCurrentRole } from "@/lib/currentRole";
import { projectTileColor } from "@/lib/projectColor";
import {
  TestCasesIcon,
  ModulesIcon,
  SuitesIcon,
  PlusIcon,
  ProjectsIcon,
} from "@/components/icons";
import { archiveProject, restoreProject } from "./actions";

export const dynamic = "force-dynamic";

function countOf(embedded) {
  return embedded?.[0]?.count ?? 0;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function lastRunInfo(run) {
  if (!run) return { label: "No runs yet", dot: "bg-slate-300" };
  const when = formatDate(run.started_at);
  if (run.status === "in_progress") {
    return { label: `Run in progress · started ${when}`, dot: "bg-blue-500" };
  }
  if (run.outcome === "pass") {
    return { label: `Last run passed · ${when}`, dot: "bg-emerald-500" };
  }
  if (run.outcome === "fail") {
    return { label: `Last run failed · ${when}`, dot: "bg-red-500" };
  }
  return { label: `Last run ${when}`, dot: "bg-slate-400" };
}

function Stat({ icon, count, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span className="font-semibold text-slate-800">{count}</span>
      {label}
    </span>
  );
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
      "id, code, name, description, test_cases(count), modules(count), suites(count), test_runs(started_at, status, outcome)",
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

  const totalCases = projects.reduce(
    (sum, p) => sum + countOf(p.test_cases),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>{showingArchived ? "Archived projects" : "Projects"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length === 0
              ? showingArchived
                ? "Nothing has been archived."
                : "Everything you test lives in a project."
              : `${projects.length} ${
                  projects.length === 1 ? "project" : "projects"
                } · ${totalCases} active test ${
                  totalCases === 1 ? "case" : "cases"
                }`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            href={showingArchived ? "/projects" : "/projects?archived=true"}
            variant="secondary"
            size="sm"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Button>
          {isAdmin && !showingArchived && (
            <Button href="/projects/new" size="sm">
              + New Project
            </Button>
          )}
        </div>
      </div>

      {projects.length === 0 && !showingArchived ? (
        <div className="rounded-xl border-2 border-dashed px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ProjectsIcon size={24} />
          </span>
          <h2 className="mb-1">No projects yet</h2>
          <p className="mb-5 text-sm text-slate-500">
            {isAdmin
              ? "Create a project for each product or platform you test."
              : "Ask an admin to create the first project."}
          </p>
          {isAdmin && <Button href="/projects/new">+ New Project</Button>}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const lastRun = lastRunInfo(project.test_runs?.[0]);
            return (
              <li
                key={project.id}
                className="group relative flex flex-col rounded-xl border bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${projectTileColor(project.code)}`}
                  >
                    {project.code.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${project.code}`}
                      className="block truncate font-semibold text-slate-900 after:absolute after:inset-0 after:content-['']"
                    >
                      {project.name}
                    </Link>
                    <span className="font-mono text-xs text-slate-400">
                      {project.code}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="relative z-10 flex gap-1 sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
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
                </div>

                <p className="mb-5 line-clamp-2 min-h-10 text-sm text-slate-600">
                  {project.description || "No description."}
                </p>

                <div className="mt-auto space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <Stat
                      icon={<TestCasesIcon size={16} />}
                      count={countOf(project.test_cases)}
                      label="cases"
                    />
                    <Stat
                      icon={<ModulesIcon size={16} />}
                      count={countOf(project.modules)}
                      label="modules"
                    />
                    <Stat
                      icon={<SuitesIcon size={16} />}
                      count={countOf(project.suites)}
                      label="suites"
                    />
                  </div>
                  <p className="flex items-center gap-2 border-t pt-3 text-xs text-slate-500">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${lastRun.dot}`}
                    />
                    {lastRun.label}
                  </p>
                </div>
              </li>
            );
          })}

          {isAdmin && !showingArchived && (
            <li>
              <Link
                href="/projects/new"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-slate-400 transition hover:border-primary hover:text-primary"
              >
                <PlusIcon size={24} />
                <span className="text-sm font-medium">New project</span>
              </Link>
            </li>
          )}
        </ul>
      )}
    </main>
  );
}
