import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  STATUS_STYLES,
  RUN_STATUS_STYLES,
  OUTCOME_STYLES,
} from "@/lib/badgeStyles";
import { formatId } from "@/lib/displayId";
import { formatStatusLabel } from "@/lib/formatLabel";
import { parseIdParam, parseDateParam } from "@/lib/params";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import CollapsibleFilters from "@/components/CollapsibleFilters";
import SegmentedControl from "@/components/SegmentedControl";
import FilterGroup from "@/components/FilterGroup";
import DateRangeFields from "@/components/DateRangeFields";
import ProgressBar from "@/components/ProgressBar";
import { PAGE } from '@/lib/pageWidths'
import { getProject } from "@/lib/project";

const PAGE_SIZE = 10;
const FIELD_CLASS =
  "border rounded p-2 text-sm h-9 w-full focus:outline-none focus:ring-2 focus:ring-primary";

export default async function RunsDashboard({ params, searchParams }) {
  const { code } = await params;
  const project = await getProject(code);
  const base = `/projects/${project.code}`;
  const {
    status,
    suiteId: suiteParam,
    testerId: testerParam,
    startDate: startParam,
    endDate: endParam,
    page,
    mine,
    outcome,
  } = await searchParams;

  const suiteId = parseIdParam(suiteParam);
  const testerId = parseIdParam(testerParam);
  const startDate = parseDateParam(startParam);
  const endDate = parseDateParam(endParam);

  const currentPage = parseInt(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await createClient();

  let currentUserId = null;
  if (mine) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  }
  const mineConflict = Boolean(
    mine && testerId && currentUserId && testerId !== currentUserId,
  );

  let query = supabase
    .from("test_runs")
    .select("*, suites(name, seq_number), run_results(status)", {
      count: "exact",
    })
    .eq("project_id", project.id)
    .order("started_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (suiteId) query = query.eq("suite_id", suiteId);
  if (testerId) query = query.eq("started_by", testerId);
  if (mine && currentUserId) query = query.eq("started_by", currentUserId);
  if (startDate) query = query.gte("started_at", startDate);
  if (endDate) query = query.lte("started_at", `${endDate}T23:59:59`);
  if (outcome) query = query.eq("outcome", outcome);

  const { data: runs, error, count } = await query;
  if (error) return <p className="p-8 text-danger">Error: {error.message}</p>;

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const [{ data: suites }, { data: testers }] = await Promise.all([
    supabase
      .from("suites")
      .select("id, name, seq_number")
      .eq("project_id", project.id)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, display_name, is_active")
      .order("display_name"),
  ]);

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
      testerId,
      startDate,
      endDate,
      page: currentPage,
      mine,
      outcome,
    };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.status) params.set("status", merged.status);
    if (merged.suiteId) params.set("suiteId", merged.suiteId);
    if (merged.testerId) params.set("testerId", merged.testerId);
    if (merged.startDate) params.set("startDate", merged.startDate);
    if (merged.endDate) params.set("endDate", merged.endDate);
    if (merged.mine) params.set("mine", "true");
    if (merged.outcome) params.set("outcome", merged.outcome);
    if (merged.page && merged.page > 1) params.set("page", merged.page);
    const qs = params.toString();
    return qs ? `${base}/runs?${qs}` : `${base}/runs`;
  }

  const advancedFilterCount = [
    suiteId,
    testerId,
    startDate,
    endDate,
    outcome,
    mine,
  ].filter(Boolean).length;
  const hasActiveFilters = Boolean(status) || advancedFilterCount > 0;

  const filterForm = (
    <form method="GET" action={`${base}/runs`} className="space-y-5">
      {status && <input type="hidden" name="status" value={status} />}
      <FilterGroup label="Time range">
        <div className="flex flex-col gap-2">
          <DateRangeFields startDate={startDate} endDate={endDate} />
        </div>
      </FilterGroup>

      <FilterGroup label="Filter by">
        <div className="flex flex-col gap-2">
          <select
            name="suiteId"
            defaultValue={suiteId || ""}
            className={FIELD_CLASS}
          >
            <option value="">All suites</option>
            {(suites || []).map((suite) => (
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
            className={FIELD_CLASS}
          >
            <option value="">All testers</option>
            {(testers || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || "Unnamed user"}
                {p.is_active === false ? " (deactivated)" : ""}
              </option>
            ))}
          </select>
          <select
            name="outcome"
            defaultValue={outcome || ""}
            className={FIELD_CLASS}
          >
            <option value="">Any outcome</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 h-9">
            <input
              type="checkbox"
              name="mine"
              value="true"
              defaultChecked={!!mine}
              className="rounded"
            />
            My runs only
          </label>
        </div>
      </FilterGroup>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply
        </Button>
        {hasActiveFilters && (
          <Button href={`${base}/runs`} variant="ghost">
            Reset all
          </Button>
        )}
      </div>
    </form>
  );

  const shownFrom = runs.length > 0 ? from + 1 : 0;
  const shownTo = from + runs.length;

  return (
    <main className={PAGE.full}>
      <div className="mb-6">
        <h1>Runs Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {count || 0} {count === 1 ? "run" : "runs"}
          {hasActiveFilters ? " match the current filters" : " in this project"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-8">
          {/* Narrow screens: compact controls above the list */}
          <div className="lg:hidden">
            <div className="mb-4">
              <SegmentedControl
                options={filters.map((f) => ({
                  label: f.label,
                  href: buildHref({ status: f.value, page: 1 }),
                  active: f.value ? status === f.value : !status,
                }))}
              />
            </div>
            <CollapsibleFilters activeCount={advancedFilterCount}>
              <Card>{filterForm}</Card>
            </CollapsibleFilters>
          </div>

          {/* Wide screens: one always-visible filter panel */}
          <Card className="hidden space-y-5 lg:block">
            <FilterGroup label="Status">
              <nav aria-label="Run status" className="space-y-1">
                {filters.map((f) => {
                  const active = f.value ? status === f.value : !status;
                  return (
                    <Link
                      key={f.label}
                      href={buildHref({ status: f.value, page: 1 })}
                      aria-current={active ? "true" : undefined}
                      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary-light text-primary"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {f.label}
                    </Link>
                  );
                })}
              </nav>
            </FilterGroup>
            <div className="border-t pt-5">{filterForm}</div>
          </Card>
        </aside>

        <div className="min-w-0">
          {runs.length > 0 && (
            <p className="mb-3 text-sm text-slate-500">
              Showing {shownFrom}–{shownTo} of {count}
            </p>
          )}
          {runs.length === 0 ? (
            <div className="text-slate-500">
              <p>No runs match these filters.</p>
              {mineConflict && (
                <p className="text-sm mt-1">
                  &quot;My runs only&quot; and a different tester are both selected,
                  so nothing can match. Untick one of them.
                </p>
              )}
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {runs.map((run) => {
                  const counts = countsFor(run);
                  return (
                    <li key={run.id}>
                      <Link href={`${base}/runs/${run.id}`} className="block">
                        <Card className="hover:border-primary transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold">
                                {run.suites.seq_number && (
                                  <span className="text-slate-400 font-normal mr-2">
                                    {formatId("S", run.suites.seq_number)}
                                  </span>
                                )}
                                {run.suites.name}
                              </span>
                              <p className="text-sm text-slate-600">
                                Tester: {run.tester_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                Started:{" "}
                                {new Date(run.started_at).toLocaleDateString()}
                                {run.completed_at && (
                                  <>
                                    {" "}
                                    · Completed:{" "}
                                    {new Date(
                                      run.completed_at,
                                    ).toLocaleDateString()}
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
                              {run.status === "cancelled" && !run.outcome && (
                                <Badge className="bg-slate-100 text-slate-500">
                                  No Outcome
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <ProgressBar
                              counts={counts}
                              total={run.run_results.length}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
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
                      </Link>
                    </li>
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
        </div>
      </div>
    </main>
  );
}