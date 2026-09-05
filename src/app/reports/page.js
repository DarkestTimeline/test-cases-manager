import { createClient } from '@/lib/supabase/server'
import ReportsCharts from "./ReportsCharts";
import SuiteBreakdownChart from "./SuiteBreakdownChart";
import Button from "@/components/Button";

const WEEK_OPTIONS = [2, 4, 8, 12, 26, 52];

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default async function ReportsPage({ searchParams }) {
  const supabase = await createClient();
  const { weeks } = await searchParams;
  const weeksToShow = parseInt(weeks) || 12;

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
    if (!weekBuckets[week]) {
      weekBuckets[week] = { week, total: 0, pass: 0, fail: 0 };
    }
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
        suiteId: run.suite_id,
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
    .sort((a, b) => {
      if (a.passRate === null) return 1;
      if (b.passRate === null) return -1;
      return a.passRate - b.passRate;
    });

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
        <SuiteBreakdownChart suites={suiteData} />
      </div>
    </main>
  );
}
