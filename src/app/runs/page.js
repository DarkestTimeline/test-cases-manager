import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  STATUS_STYLES,
  RUN_STATUS_STYLES,
  OUTCOME_STYLES,
} from "@/lib/badgeStyles";
import { formatId } from "@/lib/displayId";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { formatStatusLabel } from "@/lib/formatLabel";

const PAGE_SIZE = 10;

export default async function RunsDashboard({ searchParams }) {
  const { status, suiteId, tester, startDate, endDate, page } =
    await searchParams;
  const currentPage = parseInt(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("test_runs")
    .select("*, suites(name, seq_number), run_results(status)", {
      count: "exact",
    })
    .order("started_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (suiteId) query = query.eq("suite_id", suiteId);
  if (tester) query = query.ilike("tester_name", `%${tester}%`);
  if (startDate) query = query.gte("started_at", startDate);
  if (endDate) query = query.lte("started_at", `${endDate}T23:59:59`);

  const { data: runs, error, count } = await query;
  if (error) return <p className="p-8 text-danger">Error: {error.message}</p>;

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
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

  function buildHref(overrides = {}) {
    const current = {
      status,
      suiteId,
      tester,
      startDate,
      endDate,
      page: currentPage,
    };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.status) params.set("status", merged.status);
    if (merged.suiteId) params.set("suiteId", merged.suiteId);
    if (merged.tester) params.set("tester", merged.tester);
    if (merged.startDate) params.set("startDate", merged.startDate);
    if (merged.endDate) params.set("endDate", merged.endDate);
    if (merged.page && merged.page > 1) params.set("page", merged.page);
    const qs = params.toString();
    return qs ? `/runs?${qs}` : "/runs";
  }

  const hasActiveFilters = status || suiteId || tester || startDate || endDate;

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <h1 className="mb-4">Runs Dashboard</h1>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => {
          const isActive = f.value ? status === f.value : !status;
          return (
            <Button
              key={f.label}
              href={buildHref({ status: f.value, page: 1 })}
              variant={isActive ? "primary" : "secondary"}
              size="sm"
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      <form
        method="GET"
        action="/runs"
        className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center mb-6"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <select
          name="suiteId"
          defaultValue={suiteId || ""}
          className="border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary"
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
          className="border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 w-full sm:w-auto">
          <span className="shrink-0">From</span>
          <input
            type="date"
            name="startDate"
            defaultValue={startDate || ""}
            className="border rounded p-2 text-sm h-9 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:light]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 w-full sm:w-auto">
          <span className="shrink-0">To</span>
          <input
            type="date"
            name="endDate"
            defaultValue={endDate || ""}
            className="border rounded p-2 text-sm h-9 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:light]"
          />
        </label>
        <Button type="submit" className="w-full sm:w-auto">
          Filter
        </Button>
        {hasActiveFilters && (
          <Button href="/runs" variant="ghost">
            Clear all
          </Button>
        )}
      </form>

      {runs.length === 0 ? (
        <p className="text-slate-500">No runs match these filters.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {runs.map((run) => {
              const counts = countsFor(run);
              return (
                <Card key={run.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        href={`/runs/${run.id}`}
                        className="font-semibold hover:underline"
                      >
                        {run.suites.seq_number && (
                          <span className="text-slate-400 font-normal mr-2">
                            {formatId("S", run.suites.seq_number)}
                          </span>
                        )}
                        {run.suites.name}
                      </Link>
                      <p className="text-sm text-slate-600">
                        Tester: {run.tester_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Started: {new Date(run.started_at).toLocaleDateString()}
                        {run.completed_at && (
                          <>
                            {" "}
                            · Completed:{" "}
                            {new Date(run.completed_at).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 items-start">
                      <Badge className={RUN_STATUS_STYLES[run.status]}>
                        {formatStatusLabel(run.status)}
                      </Badge>
                      {run.outcome && (
                        <Badge className={OUTCOME_STYLES[run.outcome]}>
                          {formatStatusLabel(run.outcome)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {counts.pass > 0 && (
                      <Badge className={STATUS_STYLES.pass}>
                        {counts.pass} pass
                      </Badge>
                    )}
                    {counts.fail > 0 && (
                      <Badge className={STATUS_STYLES.fail}>
                        {counts.fail} fail
                      </Badge>
                    )}
                    {counts.blocked > 0 && (
                      <Badge className={STATUS_STYLES.blocked}>
                        {counts.blocked} blocked
                      </Badge>
                    )}
                    {counts.skipped > 0 && (
                      <Badge className={STATUS_STYLES.skipped}>
                        {counts.skipped} skipped
                      </Badge>
                    )}
                    {counts.pending > 0 && (
                      <Badge className={STATUS_STYLES.pending}>
                        {counts.pending} pending
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              {currentPage > 1 ? (
                <Button
                  href={buildHref({ page: currentPage - 1 })}
                  variant="ghost"
                >
                  ← Previous
                </Button>
              ) : (
                <span className="text-sm text-slate-300">← Previous</span>
              )}
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Button
                  href={buildHref({ page: currentPage + 1 })}
                  variant="ghost"
                >
                  Next →
                </Button>
              ) : (
                <span className="text-sm text-slate-300">Next →</span>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
