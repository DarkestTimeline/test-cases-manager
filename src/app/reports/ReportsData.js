import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ReportsCharts from "./ReportsCharts";
import BreakdownChart from "@/components/BreakdownChart";
import WorkloadChart from "@/components/WorkloadChart";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { formatStatusLabel } from "@/lib/formatLabel";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";
import { getPassRateColor } from "@/lib/reportColors";
import { createTimer } from "@/lib/timing";

function describeAge(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function toRate(pass, fail) {
  const decided = pass + fail;
  return decided > 0 ? Math.round((pass / decided) * 100) : null;
}

function toBreakdownItem(row) {
  const pass = Number(row.pass);
  const fail = Number(row.fail);
  return {
    id: row.id,
    name: row.name,
    total: Number(row.total),
    pass,
    fail,
    passRate: toRate(pass, fail),
  };
}

function byWorstFirst(a, b) {
  if (a.passRate === null && b.passRate === null)
    return a.name.localeCompare(b.name);
  if (a.passRate === null) return 1;
  if (b.passRate === null) return -1;
  return a.passRate - b.passRate || a.name.localeCompare(b.name);
}

export default async function ReportsData({
  rangeStart,
  rangeEnd,
  rangeShort,
  rangePhrase,
  suiteId,
  testerId,
  suiteNote,
  testerNote,
}) {
  const supabase = await createClient();
  const { timed, finish } = createTimer("reports");

  function scopeToFilters(query) {
    let q = query;
    if (suiteId) q = q.eq("suite_id", suiteId);
    if (testerId) q = q.eq("started_by", testerId);
    return q;
  }

  const rangeArgs = { p_range_start: rangeStart, p_range_end: rangeEnd };

  const [
    { count: inProgressCount },
    { data: latestStarted },
    { data: latestCompleted },
    { data: weeklyRows, error: weeklyError },
    { data: suiteRows, error: suiteError },
    { data: moduleRows, error: moduleError },
    { data: testerRows, error: testerError },
    { data: neverRunRows, error: neverRunError },
    { count: activeTestCaseCount },
  ] = await Promise.all([
    timed(
      "in-progress count",
      scopeToFilters(
        supabase
          .from("test_runs")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress"),
      ),
    ),
    timed(
      "latest started",
      scopeToFilters(supabase.from("test_runs").select("started_at"))
        .order("started_at", { ascending: false })
        .limit(1),
    ),
    timed(
      "latest completed",
      scopeToFilters(
        supabase
          .from("test_runs")
          .select("completed_at")
          .not("completed_at", "is", null),
      )
        .order("completed_at", { ascending: false })
        .limit(1),
    ),
    timed(
      "weekly stats",
      supabase.rpc("weekly_run_stats", {
        ...rangeArgs,
        p_suite_id: suiteId,
        p_tester_id: testerId,
      }),
    ),
    timed(
      "suite breakdown",
      supabase.rpc("suite_breakdown", { ...rangeArgs, p_tester_id: testerId }),
    ),
    timed(
      "module breakdown",
      supabase.rpc("module_breakdown", {
        ...rangeArgs,
        p_suite_id: suiteId,
        p_tester_id: testerId,
      }),
    ),
    timed(
      "tester workload",
      supabase.rpc("tester_workload", { ...rangeArgs, p_suite_id: suiteId }),
    ),
    timed("never run", supabase.rpc("never_run_test_cases")),
    timed(
      "active test case count",
      supabase
        .from("test_cases")
        .select("*", { count: "exact", head: true })
        .is("archived_at", null),
    ),
  ]);

  finish();

  const activityDates = [
    latestStarted?.[0]?.started_at,
    latestCompleted?.[0]?.completed_at,
  ]
    .filter(Boolean)
    .map((d) => new Date(d));
  const lastActivity =
    activityDates.length > 0 ? new Date(Math.max(...activityDates)) : null;

  const weekly = weeklyRows || [];
  const chartData = weekly
    .map((row) => {
      const pass = Number(row.pass);
      const fail = Number(row.fail);
      return {
        week: row.week_start,
        volume: Number(row.total),
        decided: pass + fail,
        passRate: toRate(pass, fail),
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week));

  const overallPass = weekly.reduce((sum, row) => sum + Number(row.pass), 0);
  const overallFail = weekly.reduce((sum, row) => sum + Number(row.fail), 0);
  const overallDecided = overallPass + overallFail;
  const overallPassRate = toRate(overallPass, overallFail);

  const suiteData = (suiteRows || []).map(toBreakdownItem).sort(byWorstFirst);
  const moduleData = (moduleRows || []).map(toBreakdownItem).sort(byWorstFirst);

  const testerData = (testerRows || [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      completed: Number(row.completed),
      inProgress: Number(row.in_progress),
      cancelled: Number(row.cancelled),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const neverRunTestCases = neverRunRows || [];
  const notInAnySuiteCount = neverRunTestCases.filter(
    (tc) => Number(tc.suite_count) === 0,
  ).length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Pass Rate"
          value={overallPassRate === null ? "—" : `${overallPassRate}%`}
          valueColor={
            overallPassRate === null
              ? undefined
              : getPassRateColor(overallPassRate)
          }
          sublabel={
            weeklyError
              ? "unavailable"
              : overallDecided > 0
                ? `${overallDecided} completed run${overallDecided === 1 ? "" : "s"}, ${rangeShort}`
                : `no completed runs, ${rangeShort}`
          }
        />
        <StatCard
          label="Runs In Progress"
          value={inProgressCount || 0}
          sublabel="right now"
        />
        <StatCard
          label="Never Run"
          value={neverRunTestCases.length}
          sublabel={`of ${activeTestCaseCount || 0} active test cases`}
        />
        <StatCard
          label="Last Activity"
          value={
            lastActivity
              ? lastActivity.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          sublabel={lastActivity ? describeAge(lastActivity) : "no runs yet"}
        />
      </div>

      {weeklyError ? (
        <p className="text-danger text-sm">
          Could not load the trend charts: {weeklyError.message}
        </p>
      ) : (
        <ReportsCharts data={chartData} />
      )}

      <div className="mt-10">
        <h2 className="mb-2">Suite Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by suite, worst first. Showing runs started {rangePhrase}
          {testerNote}.
          {suiteId &&
            " Not narrowed by the suite filter, so the suites stay comparable."}
        </p>
        {suiteError ? (
          <p className="text-danger text-sm">
            Could not load suite breakdown: {suiteError.message}
          </p>
        ) : (
          <BreakdownChart
            items={suiteData}
            itemLabel="Suite"
            countLabel="Runs"
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Module Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by module, worst first. Showing results from runs started{" "}
          {rangePhrase}
          {suiteNote}
          {testerNote}.
        </p>
        {moduleError ? (
          <p className="text-danger text-sm">
            Could not load module breakdown: {moduleError.message}
          </p>
        ) : (
          <BreakdownChart
            items={moduleData}
            itemLabel="Module"
            countLabel="Results"
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Tester Workload</h2>
        <p className="text-sm text-slate-500 mb-4">
          Runs per tester, in alphabetical order. This shows how much testing
          each person is doing, not how well it went. Showing runs started{" "}
          {rangePhrase}
          {suiteNote}. Only includes runs started since accounts were added.
          {testerId &&
            " Not narrowed by the tester filter, so the team stays comparable."}
        </p>
        {testerError ? (
          <p className="text-danger text-sm">
            Could not load tester workload: {testerError.message}
          </p>
        ) : (
          <WorkloadChart items={testerData} />
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Coverage Gaps</h2>
        <p className="text-sm text-slate-500 mb-4">
          Active test cases with no recorded result in any run, most urgent
          first. Cases that are only in a run still in progress count until
          someone marks them. Not affected by any filter above.
        </p>
        {neverRunError ? (
          <p className="text-danger text-sm">
            Could not load coverage gaps: {neverRunError.message}
          </p>
        ) : neverRunTestCases.length === 0 ? (
          <p className="text-success text-sm font-medium">
            Every active test case has a recorded result. 🎉
          </p>
        ) : (
          <>
            {notInAnySuiteCount > 0 && (
              <p className="text-sm text-amber-700 mb-3">
                {notInAnySuiteCount} of these{" "}
                {notInAnySuiteCount === 1 ? "is" : "are"} not in any active
                suite, so{" "}
                {notInAnySuiteCount === 1 ? "it cannot" : "they cannot"} be run
                until added to one.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded overflow-hidden">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Test Case</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Modules</th>
                    <th className="text-left p-2">Suites</th>
                  </tr>
                </thead>
                <tbody>
                  {neverRunTestCases.map((tc) => {
                    const suiteCount = Number(tc.suite_count);
                    return (
                      <tr key={tc.id} className="border-t">
                        <td className="p-2">
                          <Link
                            href={`/test-cases/${tc.id}/edit`}
                            className="hover:underline"
                          >
                            {tc.seq_number && (
                              <span className="text-slate-400 mr-2">
                                {formatId("TC", tc.seq_number)}
                              </span>
                            )}
                            {tc.title}
                          </Link>
                        </td>
                        <td className="p-2">
                          <Badge className={PRIORITY_STYLES[tc.priority]}>
                            {formatStatusLabel(tc.priority)}
                          </Badge>
                        </td>
                        <td className="p-2 text-slate-500">
                          {tc.module_names?.length > 0
                            ? tc.module_names.join(", ")
                            : "—"}
                        </td>
                        <td className="p-2">
                          {suiteCount === 0 ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              Not in any suite
                            </Badge>
                          ) : (
                            <span className="text-slate-500">
                              {suiteCount} suite{suiteCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
