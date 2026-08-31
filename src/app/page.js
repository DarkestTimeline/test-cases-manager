import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { RUN_STATUS_STYLES, OUTCOME_STYLES } from "@/lib/badgeStyles";
import { formatStatusLabel } from "@/lib/formatLabel";

export default async function Home() {
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
      .is("archived_at", null),
    supabase
      .from("suites")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("modules")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("test_runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Active Test Cases", value: testCaseCount || 0 },
    { label: "Active Suites", value: suiteCount || 0 },
    { label: "Active Modules", value: moduleCount || 0 },
    { label: "Runs In Progress", value: inProgressCount || 0 },
  ];

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="mb-1">QA Test Manager</h1>
        <p className="text-slate-600">
          Manage test cases, build suites, and run them.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {inProgressRuns.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3">Continue Where You Left Off</h2>
          <ul className="space-y-2">
            {inProgressRuns.map((run) => (
              <li key={run.id}>
                <Link href={`/runs/${run.id}`}>
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
          <Link href="/runs" className="text-sm text-primary hover:underline">
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
                <Link href={`/runs/${run.id}`}>
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
