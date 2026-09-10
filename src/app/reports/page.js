import { createClient } from "@/lib/supabase/server";
import ReportsCharts from "./ReportsCharts";
import BreakdownChart from "@/components/BreakdownChart";
import Button from "@/components/Button";

const WEEK_OPTIONS = [4, 8, 12, 26, 52];

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

  const { data: runs } = await supabase
    .from("test_runs")
    .select("started_at, status, outcome")
    .gte("started_at", startDate.toISOString())
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
        passRate:
          decided > 0 ? Math.round((bucket.pass / decided) * 100) : null,
      };
    });

  const { data: allRuns } = await supabase
    .from("test_runs")
    .select("suite_id, status, outcome, suites(name)");

  const suiteBuckets = {};
  (allRuns || []).forEach((run) => {
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

  const { data: allResults } = await supabase
    .from("run_results")
    .select("test_case_id, status");
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
  (allResults || []).forEach((result) => {
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
        passsRate: decided > 0 ? Math.round((m.pass / decided) * 100) : null,
      };
    })
    .sort((a, b) =>
      a.pasRate === null
        ? 1
        : b.passRate === null
          ? -1
          : a.passRate - b.passRate,
    );

  const { data: testerRuns } = await supabase
    .from("test_runs")
    .select("started_by, status, outcome, profiles(display_name)")
    .not("started_by", "is", null);

  const testerBuckets = {};
  (testerRuns || []).forEach((run) => {
    if (!testerBuckets[run.started_by]) {
      testerBuckets[run.started_by] = {
        id: run.started_by,
        name: run.profiles?.display_name || "Unknown",
        total: 0,
        pass: 0,
        fail: 0,
      };
    }
    testerBuckets[run.started_by].total += 1;
    if (run.status === "completed" && run.outcome === "pass")
      testerBuckets[run.started_by].pass += 1;
    if (run.status === "completed" && run.outcome === "fail")
      testerBuckets[run.started_by].fail += 1;
  });

  const testerData = Object.values(testerBuckets)
    .map((t) => {
      const decided = t.pass + t.fail;
      return {
        ...t,
        passRate: decided > 0 ? Math.round((t.pass / decided) * 100) : null,
      };
    })
    .sort((a, b) =>
      a.passRate === null
        ? 1
        : b.passRate === null
          ? -1
          : a.passRate - b.passRate,
    );

  return (
    <main className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="mb-4">Reports</h1>

      <div className="flex gap-2 mb-6">
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

      <ReportsCharts data={chartData} />

      <div className="mt-10">
        <h2 className="mb-2">Suite Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          All-time pass rate by suite, worst first.
        </p>
        <BreakdownChart items={suiteData} itemLabel="Suite" countLabel="Runs" />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Module Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          All-time pass rate by module, worst first.
        </p>
        <BreakdownChart
          items={moduleData}
          itemLabel="Module"
          countLabel="Results"
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-2">Per-Tester Breakdown</h2>
        <p className="text-sm text-slate-500 mb-4">
          All-time pass rate by tester, worst first. Only includes runs started
          since accounts were added.
        </p>
        <BreakdownChart
          items={testerData}
          itemLabel="Tester"
          countLabel="Runs"
        />
      </div>
    </main>
  );
}
