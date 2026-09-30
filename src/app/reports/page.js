import { createClient } from "@/lib/supabase/server";
import ReportsCharts from "./ReportsCharts";
import BreakdownChart from "@/components/BreakdownChart";
import WorkloadChart from "@/components/WorkloadChart";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { formatId } from "@/lib/displayId";
import { formatStatusLabel } from "@/lib/formatLabel";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";

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

export default async function ReportsPage({ searchParams }) {
  const { weeks } = await searchParams;
  const weeksToShow = parseInt(weeks) || 12;
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeksToShow * 7);
  const startISO = startDate.toISOString();

  const { data: runs } = await supabase
    .from("test_runs")
    .select("started_at, status, outcome")
    .gte("started_at", startISO)
    .order("started_at");

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

  const { data: windowRuns } = await supabase
    .from("test_runs")
    .select("suite_id, status, outcome, suites(name)")
    .gte("started_at", startISO);

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

  const { data: windowResults } = await supabase
    .from("run_results")
    .select("test_case_id, status, test_runs!inner(started_at)")
    .gte("test_runs.started_at", startISO);

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

  const { data: testerRuns } = await supabase
    .from("test_runs")
    .select("started_by, status, profiles(display_name)")
    .not("started_by", "is", null)
    .gte("started_at", startISO);

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

      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-2">
          Time range. Applies to every section except Coverage Gaps, and is
          based on when each run started.
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEK_OPTIONS.map((w) => (
            <Button
              key={w}
              href={`/reports?weeks=${w}`}
              variant={weeksToShow === w ? "primary" : "secondary"}
              size="sm"
            >
              {w} weeks
            </Button>
          ))}
        </div>
      </div>

      <ReportsCharts data={chartData} />

      <div className="mt-10">
        <h2 className="mb-2">Suite Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by suite for runs started in the last {weeksToShow} weeks,
          worst first.
        </p>
        <BreakdownChart items={suiteData} itemLabel="Suite" countLabel="Runs" />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Module Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          Pass rate by module for results from runs started in the last{" "}
          {weeksToShow} weeks, worst first.
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
          Runs per tester over the last {weeksToShow} weeks, in alphabetical
          order. This shows how much testing each person is doing, not how well
          it went. Only includes runs started since accounts were added.
        </p>
        <WorkloadChart items={testerData} />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Coverage Gaps</h2>
        <p className="text-sm text-slate-500 mb-4">
          Active test cases that have never been run, most urgent first. Not
          affected by the time range above.
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
