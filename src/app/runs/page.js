import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  STATUS_STYLES,
  RUN_STATUS_STYLES,
  OUTCOME_STYLES,
} from "@/lib/badgeStyles";
import { formatId } from "@/lib/displayId";

export default async function RunsDashboard({ searchParams }) {
  const { status, suiteId, tester } = await searchParams;

  let query = supabase
    .from("test_runs")
    .select("*, suites(name, seq_number), run_results(status)")
    .order("started_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (suiteId) query = query.eq("suite_id", suiteId);
  if (tester) query = query.ilike("tester_name", `%${tester}%`);

  const { data: runs, error } = await query;

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  const { data: suites } = await supabase
    .from("suites")
    .select("id, name, seq_number")
    .order("name");

  function countsFor(run) {
    const results = run.run_results;
    return {
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      blocked: results.filter((r) => r.status === "blocked").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      pending: results.filter((r) => r.status === "pending").length,
    };
  }

  const filters = [
    { label: "All", value: null },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  function buildStatusHref(value) {
    const params = new URLSearchParams();
    if (value) params.set("status", value);
    if (suiteId) params.set("suiteId", suiteId);
    if (tester) params.set("tester", tester);
    const qs = params.toString();
    return qs ? `/runs?${qs}` : "/runs";
  }

  const hasActiveFilters = status || suiteId || tester;

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Runs Dashboard</h1>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => {
          const isActive = f.value ? status === f.value : !status;
          return (
            <Link
              key={f.label}
              href={buildStatusHref(f.value)}
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

      <form
        method="GET"
        action="/runs"
        className="flex flex-wrap gap-2 items-center mb-6"
      >
        {status && <input type="hidden" name="status" value={status} />}

        <select
          name="suiteId"
          defaultValue={suiteId || ""}
          className="border rounded p-2 text-sm"
        >
          <option value="">All Suites</option>
          {suites.map((suite) => (
            <option key={suite.id} value={suite.id}>
              {suite.seq_number ? `${formatId("S", suite.seq_number)} ` : ""}
              {suite.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="tester"
          defaultValue={tester || ""}
          placeholder="Search tester..."
          className="border rounded p-2 text-sm"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Filter
        </button>

        {hasActiveFilters && (
          <Link href="/runs" className="text-sm text-gray-500 hover:underline">
            Clear all
          </Link>
        )}
      </form>

      {runs.length === 0 ? (
        <p className="text-gray-500">No runs match these filters.</p>
      ) : (
        <ul className="space-y-3">
          {runs.map((run) => {
            const counts = countsFor(run);
            return (
              <li key={run.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/runs/${run.id}`}
                      className="font-semibold hover:underline"
                    >
                      {run.suites.seq_number && (
                        <span className="text-gray-400 font-normal mr-2">
                          {formatId("S", run.suites.seq_number)}
                        </span>
                      )}
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
                  {counts.skipped > 0 && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES.skipped}`}
                    >
                      {counts.skipped} skipped
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
