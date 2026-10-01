import { createClient } from "@/lib/supabase/server";
import ReportsCharts from "./ReportsCharts";
import BreakdownChart from "@/components/BreakdownChart";
import WorkloadChart from "@/components/WorkloadChart";
import StatCard from "@/components/StatCard";
import DateRangeFields from "@/components/DateRangeFields";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { formatStatusLabel } from "@/lib/formatLabel";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";
import { getPassRateColor } from "@/lib/reportColors";

const WEEK_OPTIONS = [4, 8, 12, 26, 52];
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function describeAge(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function parseDateParam(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : null;
}

function formatDay(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ReportsPage({ searchParams }) {
  const {
    weeks,
    startDate: startParam,
    endDate: endParam,
  } = await searchParams;
  const startDate = parseDateParam(startParam);
  const endDate = parseDateParam(endParam);
  const isCustomRange = Boolean(startDate || endDate);
  const rangeIsBackwards = Boolean(startDate && endDate && startDate > endDate);
  const weeksToShow = parseInt(weeks) || 12;
  const supabase = await createClient();

  let rangeStart = null;
  let rangeEnd = null;
  let rangeShort;
  let rangePhrase;

  if (isCustomRange) {
    rangeStart = startDate;
    rangeEnd = endDate ? `${endDate}T23:59:59` : null;
    if (startDate && endDate) {
      rangeShort = `${formatDay(startDate)} to ${formatDay(endDate)}`;
      rangePhrase = `from ${rangeShort}`;
    } else if (startDate) {
      rangeShort = `since ${formatDay(startDate)}`;
      rangePhrase = rangeShort;
    } else {
      rangeShort = `up to ${formatDay(endDate)}`;
      rangePhrase = rangeShort;
    }
  } else {
    const start = new Date();
    start.setDate(start.getDate() - weeksToShow * 7);
    rangeStart = start.toISOString();
    rangeShort = `last ${weeksToShow} weeks`;
    rangePhrase = `in the ${rangeShort}`;
  }

  function withRange(query, column) {
    let q = query;
    if (rangeStart) q = q.gte(column, rangeStart);
    if (rangeEnd) q = q.lte(column, rangeEnd);
    return q;
  }

  const [
    { count: inProgressCount },
    { data: latestStarted },
    { data: latestCompleted },
  ] = await Promise.all([
    supabase
      .from("test_runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("test_runs")
      .select("started_at")
      .order("started_at", { ascending: false })
      .limit(1),
    supabase
      .from("test_runs")
      .select("completed_at")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1),
  ]);

  const activityDates = [
    latestStarted?.[0]?.started_at,
    latestCompleted?.[0]?.completed_at,
  ]
    .filter(Boolean)
    .map((d) => new Date(d));
  const lastActivity =
    activityDates.length > 0 ? new Date(Math.max(...activityDates)) : null;

  const { data: runs } = await withRange(
    supabase.from("test_runs").select("started_at, status, outcome"),
    "started_at",
  ).order("started_at");

  const weekBuckets = {};
  (runs || []).forEach((run) => {
    const week = getWeekStart(run.started_at);
    if (!weekBuckets[week])
      weekBuckets[week] = { week, total: 0, pass: 0, fail: 0 };
    weekBuckets[week].total += 1;
    if (run.status === "completed" && run.outcome === "pass")
      weekBuckets[week].pass += 1;
    if (run.status === "completed" && run.outcome === "fail")
      weekBuckets[week].fail += 1;
  });

  const chartData = Object.values(weekBuckets)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((bucket) => {
      const decided = bucket.pass + bucket.fail;
      return {
        week: bucket.week,
        volume: bucket.total,
        decided,
        passRate:
          decided > 0 ? Math.round((bucket.pass / decided) * 100) : null,
      };
    });

  const overallPass = Object.values(weekBuckets).reduce(
    (sum, b) => sum + b.pass,
    0,
  );
  const overallFail = Object.values(weekBuckets).reduce(
    (sum, b) => sum + b.fail,
    0,
  );
  const overallDecided = overallPass + overallFail;
  const overallPassRate =
    overallDecided > 0
      ? Math.round((overallPass / overallDecided) * 100)
      : null;

  const { data: windowRuns } = await withRange(
    supabase
      .from("test_runs")
      .select("suite_id, status, outcome, suites(name)"),
    "started_at",
  );

  const suiteBuckets = {};
  (windowRuns || []).forEach((run) => {
    if (!run.suite_id) return;
    if (!suiteBuckets[run.suite_id]) {
      suiteBuckets[run.suite_id] = {
        id: run.suite_id,
        name: run.suites?.name || "Unknown Suite",
        total: 0,
        pass: 0,
        fail: 0,
      };
    }
    suiteBuckets[run.suite_id].total += 1;
    if (run.status === "completed" && run.outcome === "pass")
      suiteBuckets[run.suite_id].pass += 1;
    if (run.status === "completed" && run.outcome === "fail")
      suiteBuckets[run.suite_id].fail += 1;
  });

  const suiteData = Object.values(suiteBuckets)
    .map((s) => {
      const decided = s.pass + s.fail;
      return {
        ...s,
        passRate: decided > 0 ? Math.round((s.pass / decided) * 100) : null,
      };
    })
    .sort((a, b) =>
      a.passRate === null
        ? 1
        : b.passRate === null
          ? -1
          : a.passRate - b.passRate,
    );

  const { data: windowResults } = await withRange(
    supabase
      .from("run_results")
      .select("test_case_id, status, test_runs!inner(started_at)"),
    "test_runs.started_at",
  );

  const { data: moduleCasesData } = await supabase
    .from("module_cases")
    .select("test_case_id, modules(id, name)");

  const modulesByTestCaseId = {};
  (moduleCasesData || []).forEach((mc) => {
    if (!mc.modules) return;
    if (!modulesByTestCaseId[mc.test_case_id])
      modulesByTestCaseId[mc.test_case_id] = [];
    modulesByTestCaseId[mc.test_case_id].push(mc.modules);
  });

  const moduleBuckets = {};
  (windowResults || []).forEach((result) => {
    const mods = modulesByTestCaseId[result.test_case_id] || [];
    mods.forEach((mod) => {
      if (!moduleBuckets[mod.id])
        moduleBuckets[mod.id] = {
          id: mod.id,
          name: mod.name,
          total: 0,
          pass: 0,
          fail: 0,
        };
      moduleBuckets[mod.id].total += 1;
      if (result.status === "pass") moduleBuckets[mod.id].pass += 1;
      if (result.status === "fail") moduleBuckets[mod.id].fail += 1;
    });
  });

  const moduleData = Object.values(moduleBuckets)
    .map((m) => {
      const decided = m.pass + m.fail;
      return {
        ...m,
        passRate: decided > 0 ? Math.round((m.pass / decided) * 100) : null,
      };
    })
    .sort((a, b) =>
      a.passRate === null
        ? 1
        : b.passRate === null
          ? -1
          : a.passRate - b.passRate,
    );

  const { data: testerRuns } = await withRange(
    supabase
      .from("test_runs")
      .select("started_by, status, profiles(display_name)")
      .not("started_by", "is", null),
    "started_at",
  );

  const testerBuckets = {};
  (testerRuns || []).forEach((run) => {
    if (!testerBuckets[run.started_by]) {
      testerBuckets[run.started_by] = {
        id: run.started_by,
        name: run.profiles?.display_name || "Unknown",
        completed: 0,
        inProgress: 0,
        cancelled: 0,
      };
    }
    if (run.status === "completed")
      testerBuckets[run.started_by].completed += 1;
    if (run.status === "in_progress")
      testerBuckets[run.started_by].inProgress += 1;
    if (run.status === "cancelled")
      testerBuckets[run.started_by].cancelled += 1;
  });

  const testerData = Object.values(testerBuckets).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const { data: activeTestCases } = await supabase
    .from("test_cases")
    .select("id, title, seq_number, priority")
    .is("archived_at", null);

  const { data: everRunTestCaseIds } = await supabase
    .from("run_results")
    .select("test_case_id");
  const runTestCaseIdSet = new Set(
    (everRunTestCaseIds || []).map((r) => r.test_case_id),
  );

  const neverRunTestCases = (activeTestCases || [])
    .filter((tc) => !runTestCaseIdSet.has(tc.id))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  return (
    <main className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="mb-4">Reports</h1>

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Quick range:</span>
          {WEEK_OPTIONS.map((w) => (
            <Button
              key={w}
              href={`/reports?weeks=${w}`}
              variant={
                !isCustomRange && weeksToShow === w ? "primary" : "secondary"
              }
              size="sm"
            >
              {w} weeks
            </Button>
          ))}
        </div>

        <form
          method="GET"
          action="/reports"
          className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center"
        >
          <DateRangeFields startDate={startDate} endDate={endDate} />
          <Button type="submit" className="w-full sm:w-auto">
            Apply
          </Button>
          {isCustomRange && (
            <Button href="/reports" variant="ghost">
              Reset
            </Button>
          )}
        </form>

        <p className="text-sm text-slate-500">
          Showing runs started {rangePhrase}. Applies to the pass rate, charts
          and breakdowns. The other summary numbers and Coverage Gaps always
          cover everything.
        </p>
        {rangeIsBackwards && (
          <p className="text-sm text-danger">
            The start date is after the end date, so nothing matches.
          </p>
        )}
        {isCustomRange && !rangeIsBackwards && (
          <p className="text-xs text-slate-400">
            Weekly bars at the edges of a custom range can cover only part of a
            week.
          </p>
        )}
      </div>

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
            overallDecided > 0
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
          sublabel={`of ${(activeTestCases || []).length} active test cases`}
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

      <ReportsCharts data={chartData} />

      <div className="mt-10">
        <h2 className="mb-2">Suite Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by suite, worst first. Showing runs started {rangePhrase}.
        </p>
        <BreakdownChart items={suiteData} itemLabel="Suite" countLabel="Runs" />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Module Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by module, worst first. Showing results from runs started{" "}
          {rangePhrase}.
        </p>
        <BreakdownChart
          items={moduleData}
          itemLabel="Module"
          countLabel="Results"
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Tester Workload</h2>
        <p className="text-sm text-slate-500 mb-4">
          Runs per tester, in alphabetical order. This shows how much testing
          each person is doing, not how well it went. Showing runs started{" "}
          {rangePhrase}. Only includes runs started since accounts were added.
        </p>
        <WorkloadChart items={testerData} />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Coverage Gaps</h2>
        <p className="text-sm text-slate-500 mb-4">
          Active test cases that have never been run, most urgent first. Not
          affected by the date range above.
        </p>
        {neverRunTestCases.length === 0 ? (
          <p className="text-success text-sm font-medium">
            Every active test case has been run at least once. 🎉
          </p>
        ) : (
          <table className="w-full text-sm border rounded overflow-hidden">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">Test Case</th>
                <th className="text-left p-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {neverRunTestCases.map((tc) => (
                <tr key={tc.id} className="border-t">
                  <td className="p-2">
                    {tc.seq_number && (
                      <span className="text-slate-400 mr-2">
                        {formatId("TC", tc.seq_number)}
                      </span>
                    )}
                    {tc.title}
                  </td>
                  <td className="p-2">
                    <Badge className={PRIORITY_STYLES[tc.priority]}>
                      {formatStatusLabel(tc.priority)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
