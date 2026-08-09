import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { STATUS_STYLES } from "@/lib/statusStyles";

const RUN_STATUS_STYLES = {
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-gray-800 text-white",
};

const OUTCOME_STYLES = {
  pass: "bg-green-100 text-green-700",
  fail: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function RunsDashboard({ searchParams }) {
  const { status } = await searchParams;

  let query = supabase
    .from("test_runs")
    .select("*, suites(name)")
    .order("started_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: runs, error } = await query;

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  const runIds = runs.map((r) => r.id);

  const { data: allResults } =
    runIds.length > 0
      ? await supabase.from("run_results").select("*").in("test_run_id", runIds)
      : { data: [] };

  function countsFor(runId) {
    const results = allResults.filter((r) => r.test_run_id === runId);
    return {
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      blocked: results.filter((r) => r.status === "blocked").length,
      pending: results.filter((r) => r.status === "pending").length,
    };
  }

  const filters = [
    { label: "All", value: null },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <main className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Runs Dashboard</h1>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => {
          const isActive = f.value ? status === f.value : !status;
          return (
            <Link
              key={f.label}
              href={f.value ? `/runs?status=${f.value}` : "/runs"}
              className={`px-3 py-1 rounded text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {runs.length === 0 ? (
        <p className="text-gray-500">No runs found.</p>
      ) : (
        <ul className="space-y-3">
          {runs.map((run) => {
            const counts = countsFor(run.id);
            return (
              <li key={run.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/runs/${run.id}`}
                      className="font-semibold hover:underline"
                    >
                      {run.suites.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Tester: {run.tester_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Started: {new Date(run.started_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-1 items-start">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${RUN_STATUS_STYLES[run.status]}`}
                    >
                      {run.status}
                    </span>
                    {run.outcome && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${OUTCOME_STYLES[run.outcome]}`}
                      >
                        {run.outcome}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {counts.pass > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES.pass}`}
                    >
                      {counts.pass} pass
                    </span>
                  )}
                  {counts.fail > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES.fail}`}
                    >
                      {counts.fail} fail
                    </span>
                  )}
                  {counts.blocked > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES.blocked}`}
                    >
                      {counts.blocked} blocked
                    </span>
                  )}
                  {counts.pending > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES.pending}`}
                    >
                      {counts.pending} pending
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
