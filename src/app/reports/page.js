import { createClient } from "@/lib/supabase/server";
import ReportsCharts from "./ReportsCharts";
import BreakdownChart from "@/components/BreakdownChart";
import WorkloadChart from "@/components/WorkloadChart";
import StatCard from "@/components/StatCard";
import SegmentedControl from "@/components/SegmentedControl";
import DateRangeFields from "@/components/DateRangeFields";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { formatStatusLabel } from "@/lib/formatLabel";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";
import { getPassRateColor } from "@/lib/reportColors";
import Link from "next/link";

const WEEK_OPTIONS = [2, 4, 8, 12, 26, 52];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2";
const SELECT_CLASS =
  "border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary";

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

function parseIdParam(value) {
  return UUID_PATTERN.test(value || "") ? value : null;
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
    suiteId: suiteParam,
    testerId: testerParam,
  } = await searchParams;

  const startDate = parseDateParam(startParam);
  const endDate = parseDateParam(endParam);
  const suiteId = parseIdParam(suiteParam);
  const testerId = parseIdParam(testerParam);
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

  function applyFilters(
    query,
    { prefix = "", range = true, suite = true, tester = true } = {},
  ) {
    let q = query;
    if (range && rangeStart) q = q.gte(`${prefix}started_at`, rangeStart);
    if (range && rangeEnd) q = q.lte(`${prefix}started_at`, rangeEnd);
    if (suite && suiteId) q = q.eq(`${prefix}suite_id`, suiteId);
    if (tester && testerId) q = q.eq(`${prefix}started_by`, testerId);
    return q;
  }

  function weeksHref(w) {
    const params = new URLSearchParams();
    params.set("weeks", w);
    if (suiteId) params.set("suiteId", suiteId);
    if (testerId) params.set("testerId", testerId);
    return `/reports?${params.toString()}`;
  }

  const [
    { count: inProgressCount },
    { data: latestStarted },
    { data: latestCompleted },
    { data: suiteOptions },
    { data: testerOptions },
  ] = await Promise.all([
    applyFilters(
      supabase
        .from("test_runs")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress"),
      { range: false },
    ),
    applyFilters(supabase.from("test_runs").select("started_at"), {
      range: false,
    })
      .order("started_at", { ascending: false })
      .limit(1),
    applyFilters(
      supabase
        .from("test_runs")
        .select("completed_at")
        .not("completed_at", "is", null),
      { range: false },
    )
      .order("completed_at", { ascending: false })
      .limit(1),
    supabase.from("suites").select("id, name, seq_number").order("name"),
    supabase.from("profiles").select("id, display_name").order("display_name"),
  ]);

  const suiteName = suiteId
    ? (suiteOptions || []).find((s) => s.id === suiteId)?.name
    : null;
  const testerName = testerId
    ? (testerOptions || []).find((p) => p.id === testerId)?.display_name
    : null;
  const suiteNote = suiteName ? ` for ${suiteName}` : "";
  const testerNote = testerName ? ` by ${testerName}` : "";
  const showReset =
    isCustomRange ||
    Boolean(suiteId) ||
    Boolean(testerId) ||
    weeksToShow !== 12;

  const activityDates = [
    latestStarted?.[0]?.started_at,
    latestCompleted?.[0]?.completed_at,
  ]
    .filter(Boolean)
    .map((d) => new Date(d));
  const lastActivity =
    activityDates.length > 0 ? new Date(Math.max(...activityDates)) : null;

  const { data: runs } = await applyFilters(
    supabase.from("test_runs").select("started_at, status, outcome"),
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

  const { data: windowRuns } = await applyFilters(
    supabase
      .from("test_runs")
      .select("suite_id, status, outcome, suites(name)"),
    { suite: false },
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

  const { data: windowResults } = await applyFilters(
    supabase
      .from("run_results")
      .select(
        "test_case_id, status, test_runs!inner(started_at, suite_id, started_by)",
      ),
    { prefix: "test_runs." },
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

  const { data: testerRuns } = await applyFilters(
    supabase
      .from("test_runs")
      .select("started_by, status, profiles(display_name)")
      .not("started_by", "is", null),
    { tester: false },
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

  const [
    { data: neverRunRows, error: neverRunError },
    { count: activeTestCaseCount },
  ] = await Promise.all([
    supabase.rpc("never_run_test_cases"),
    supabase
      .from("test_cases")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null),
  ]);

  const neverRunTestCases = neverRunRows || [];
  const notInAnySuiteCount = neverRunTestCases.filter(
    (tc) => Number(tc.suite_count) === 0,
  ).length;

  return (
    <main className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="mb-4">Reports</h1>

      <form method="GET" action="/reports">
        {!isCustomRange && (
          <input type="hidden" name="weeks" value={weeksToShow} />
        )}
        <Card className="space-y-5">
          <div>
            <p className={SECTION_LABEL}>Time range</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <SegmentedControl
                options={WEEK_OPTIONS.map((w) => ({
                  label: `${w}w`,
                  title: `Last ${w} weeks`,
                  href: weeksHref(w),
                  active: !isCustomRange && weeksToShow === w,
                }))}
              />
              <span className="hidden sm:inline text-sm text-slate-400">
                or
              </span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <DateRangeFields startDate={startDate} endDate={endDate} />
              </div>
            </div>
          </div>

          <div>
            <p className={SECTION_LABEL}>Filter by</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
              <select
                name="suiteId"
                defaultValue={suiteId || ""}
                className={SELECT_CLASS}
              >
                <option value="">All suites</option>
                {(suiteOptions || []).map((suite) => (
                  <option key={suite.id} value={suite.id}>
                    {suite.seq_number
                      ? `${formatId("S", suite.seq_number)} `
                      : ""}
                    {suite.name}
                  </option>
                ))}
              </select>
              <select
                name="testerId"
                defaultValue={testerId || ""}
                className={SELECT_CLASS}
              >
                <option value="">All testers</option>
                {(testerOptions || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
              <Button type="submit" className="w-full sm:w-auto">
                Apply
              </Button>
              {showReset && (
                <Button href="/reports" variant="ghost">
                  Reset all
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>

      <div className="mt-3 mb-8 space-y-1">
        <p className="text-sm text-slate-500">
          Showing runs started {rangePhrase}
          {suiteNote}
          {testerNote}.
        </p>
        <p className="text-xs text-slate-400">
          The date range applies to the pass rate, charts and breakdowns. Suite
          and tester apply to everything based on runs. Never Run and Coverage
          Gaps are about test cases, so they ignore every filter.
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

      <ReportsCharts data={chartData} />

      <div className="mt-10">
        <h2 className="mb-2">Suite Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by suite, worst first. Showing runs started {rangePhrase}
          {testerNote}.
          {suiteId &&
            " Not narrowed by the suite filter, so the suites stay comparable."}
        </p>
        <BreakdownChart items={suiteData} itemLabel="Suite" countLabel="Runs" />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Module Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by module, worst first. Showing results from runs started{" "}
          {rangePhrase}
          {suiteNote}
          {testerNote}.
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
          {rangePhrase}
          {suiteNote}. Only includes runs started since accounts were added.
          {testerId &&
            " Not narrowed by the tester filter, so the team stays comparable."}
        </p>
        <WorkloadChart items={testerData} />
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
    </main>
  );
}
