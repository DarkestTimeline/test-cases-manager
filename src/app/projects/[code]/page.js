import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { formatId } from "@/lib/displayId";
import { RUN_STATUS_STYLES, OUTCOME_STYLES } from "@/lib/badgeStyles";
import { formatStatusLabel } from "@/lib/formatLabel";
import StatCard from "@/components/StatCard";
import StartRunButton from "@/components/StartRunButton";
import LocalTime from "@/components/LocalTime";
import { PAGE } from "@/lib/pageWidths";
import { getProject } from "@/lib/project";

export const dynamic = "force-dynamic";

function RunRow({ run, base, showOutcome }) {
  return (
    <li>
      <Link href={`${base}/runs/${run.id}`}>
        <Card className="flex items-center justify-between gap-3 hover:border-primary transition-colors">
          <div className="min-w-0">
            <span className="font-medium">
              {run.suites.seq_number && (
                <span className="text-slate-400 font-normal mr-2">
                  {formatId("S", run.suites.seq_number)}
                </span>
              )}
              {run.suites.name}
            </span>
            <p className="text-sm text-slate-500">
              {run.tester_name} · <LocalTime value={run.started_at} />
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Badge className={RUN_STATUS_STYLES[run.status]}>
              {formatStatusLabel(run.status)}
            </Badge>
            {showOutcome && run.outcome && (
              <Badge className={OUTCOME_STYLES[run.outcome]}>
                {formatStatusLabel(run.outcome)}
              </Badge>
            )}
          </div>
        </Card>
      </Link>
    </li>
  );
}

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
    { data: neverRun },
    { data: inProgressRuns },
    { data: recentRuns },
    { data: lastFailedRun },
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
    supabase.rpc("never_run_test_cases", { p_project_id: project.id }),
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
      .neq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("test_runs")
      .select("id, started_at, suites(name, seq_number)")
      .eq("project_id", project.id)
      .eq("outcome", "fail")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: failedResults } = lastFailedRun
    ? await supabase
        .from("run_results")
        .select("id, title, status, test_case_code")
        .eq("test_run_id", lastFailedRun.id)
        .in("status", ["fail", "blocked"])
        .order("position")
        .limit(6)
    : { data: [] };

  const stats = [
    { label: "Active Test Cases", value: testCaseCount || 0, href: `${base}/test-cases` },
    { label: "Active Suites", value: suiteCount || 0, href: `${base}/suites` },
    { label: "Active Modules", value: moduleCount || 0, href: `${base}/modules` },
    { label: "Runs In Progress", value: inProgressCount || 0, href: `${base}/runs?status=in_progress` },
    { label: "Never Run", value: neverRun?.length ?? 0, href: `${base}/reports#coverage-gaps` },
  ];

  return (
    <main className={PAGE.wide}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
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
        {!project.archived_at && (
          <div className="flex flex-wrap items-center gap-2">
            <Button href={`${base}/test-cases/new`} variant="secondary">
              + Test Case
            </Button>
            <Button href={`${base}/suites/new`} variant="secondary">
              + Suite
            </Button>
            <Button href={`${base}/modules/new`} variant="secondary">
              + Module
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
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
              <RunRow key={run.id} run={run} base={base} />
            ))}
          </ul>
        </div>
      )}

      {lastFailedRun && failedResults.length > 0 && (
        <div className="mb-10">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2>Latest Failures</h2>
            <Link
              href={`${base}/runs/${lastFailedRun.id}`}
              className="text-sm text-primary hover:underline"
            >
              {lastFailedRun.suites.seq_number
                ? `${formatId("S", lastFailedRun.suites.seq_number)} `
                : ""}
              {lastFailedRun.suites.name} →
            </Link>
          </div>
          <Card className="p-0">
            <ul className="divide-y">
              {failedResults.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    {result.test_case_code && (
                      <span className="mr-2 text-slate-400">
                        {result.test_case_code}
                      </span>
                    )}
                    {result.title}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      result.status === "fail"
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {formatStatusLabel(result.status)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
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
            {inProgressRuns.length > 0
              ? "No finished runs yet."
              : "No runs yet — start one to get going."}
          </p>
        ) : (
          <ul className="space-y-2">
            {recentRuns.map((run) => (
              <RunRow key={run.id} run={run} base={base} showOutcome />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
