import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { RUN_STATUS_STYLES, OUTCOME_STYLES } from "@/lib/badgeStyles";
import { formatStatusLabel } from "@/lib/formatLabel";
import StatCard from "@/components/StatCard";
import { PAGE } from "@/lib/pageWidths";
import { getProject } from "@/lib/project";

export const dynamic = "force-dynamic";

export default async function ProjectOverview({ params }) {
  const { code } = await params;
  const project = await getProject(code);
  const base = `/projects/${project.code}`;
  const supabase = await createClient();

  const [
    { count: testCaseCount },
    { count: suiteCount },
    { count: moduleCount },
    { count: inProgressCount },
    { data: inProgressRuns },
    { data: recentRuns },
  ] = await Promise.all([
    supabase
      .from("test_cases")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("archived_at", null),
    supabase
      .from("suites")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("archived_at", null),
    supabase
      .from("modules")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("archived_at", null),
    supabase
      .from("test_runs")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("status", "in_progress"),
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .eq("project_id", project.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .eq("project_id", project.id)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: "Active Test Cases",
      value: testCaseCount || 0,
      href: `${base}/test-cases`,
    },
    {
      label: "Active Suites",
      value: suiteCount || 0,
      href: `${base}/suites`,
    },
    {
      label: "Active Modules",
      value: moduleCount || 0,
      href: `${base}/modules`,
    },
    {
      label: "Runs In Progress",
      value: inProgressCount || 0,
      href: `${base}/runs?status=in_progress`,
    },
  ];

  return (
    <main className={PAGE.wide}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Badge className="bg-slate-100 text-slate-700 font-mono">
            {project.code}
          </Badge>
          <h1>{project.name}</h1>
        </div>
        <p className="text-slate-600">
          {project.description ||
            "Manage test cases, build suites, and run them."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            href={stat.href}
          />
        ))}
      </div>

      {inProgressRuns.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3">Ongoing Runs</h2>
          <ul className="space-y-2">
            {inProgressRuns.map((run) => (
              <li key={run.id}>
                <Link href={`${base}/runs/${run.id}`}>
                  <Card className="flex justify-between items-center hover:border-primary transition-colors">
                    <div>
                      <span className="font-medium">
                        {run.suites.seq_number && (
                          <span className="text-slate-400 font-normal mr-2">
                            {formatId("S", run.suites.seq_number)}
                          </span>
                        )}
                        {run.suites.name}
                      </span>
                      <p className="text-sm text-slate-500">
                        Tester: {run.tester_name}
                      </p>
                    </div>
                    <Badge className={RUN_STATUS_STYLES[run.status]}>
                      {formatStatusLabel(run.status)}
                    </Badge>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2>Recent Runs</h2>
          <Link
            href={`${base}/runs`}
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        {recentRuns.length === 0 ? (
          <p className="text-slate-500">
            No runs yet — start one to get going.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentRuns.map((run) => (
              <li key={run.id}>
                <Link href={`${base}/runs/${run.id}`}>
                  <Card className="flex justify-between items-center hover:border-primary transition-colors">
                    <span className="font-medium">
                      {run.suites.seq_number && (
                        <span className="text-slate-400 font-normal mr-2">
                          {formatId("S", run.suites.seq_number)}
                        </span>
                      )}
                      {run.suites.name}
                    </span>
                    <div className="flex gap-1">
                      <Badge className={RUN_STATUS_STYLES[run.status]}>
                        {formatStatusLabel(run.status)}
                      </Badge>
                      {run.outcome && (
                        <Badge className={OUTCOME_STYLES[run.outcome]}>
                          {formatStatusLabel(run.outcome)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
