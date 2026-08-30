import { supabase } from "@/lib/supabaseClient";
import ReportsCharts from "./ReportsCharts";

const WEEKS_TO_SHOW = 12;

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default async function ReportsPage() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - WEEKS_TO_SHOW * 7);

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

  return (
    <main className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="mb-6">Reports</h1>
      <ReportsCharts data={chartData} />
    </main>
  );
}
