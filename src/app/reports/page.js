import { Suspense } from "react";
import Form from "next/form";
import { createClient } from "@/lib/supabase/server";
import ReportsData from "./ReportsData";
import { ReportsDataSkeleton } from "./ReportsSkeleton";
import SegmentedControl from "@/components/SegmentedControl";
import DateRangeFields from "@/components/DateRangeFields";
import FormSubmitButton from "@/components/FormSubmitButton";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { formatId } from "@/lib/displayId";
import { parseIdParam, parseDateParam } from "@/lib/params";
import { resolveRange } from "@/lib/reportRange";
import { PAGE } from "@/lib/pageWidths";

const WEEK_OPTIONS = [4, 8, 12, 26, 52];
const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2";
const SELECT_CLASS =
  "border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary";

export default async function ReportsPage({ searchParams }) {
  const params = await searchParams;
  const startDate = parseDateParam(params.startDate);
  const endDate = parseDateParam(params.endDate);
  const suiteId = parseIdParam(params.suiteId);
  const testerId = parseIdParam(params.testerId);
  const range = resolveRange({ weeks: params.weeks, startDate, endDate });
  const { isCustomRange, rangeIsBackwards, weeksToShow, rangePhrase } = range;

  const supabase = await createClient();
  const [{ data: suiteOptions }, { data: testerOptions }] = await Promise.all([
    supabase.from("suites").select("id, name, seq_number").order("name"),
    supabase
      .from("profiles")
      .select("id, display_name, is_active")
      .order("display_name"),
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

  const filterKey = [
    isCustomRange ? "custom" : weeksToShow,
    startDate,
    endDate,
    suiteId,
    testerId,
  ].join("|");

  function weeksHref(w) {
    const qs = new URLSearchParams();
    qs.set("weeks", w);
    if (suiteId) qs.set("suiteId", suiteId);
    if (testerId) qs.set("testerId", testerId);
    return `/reports?${qs.toString()}`;
  }

  return (
    <main className={PAGE.reports}>
      <h1 className="mb-4">Reports</h1>

      <Form key={`form|${filterKey}`} action="/reports">
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
                    {p.display_name || "Unnamed user"}
                    {p.is_active === false ? " (deactivated)" : ""}
                  </option>
                ))}
              </select>
              <FormSubmitButton
                pendingLabel="Applying…"
                className="w-full sm:w-auto sm:min-w-24"
              >
                Apply
              </FormSubmitButton>
              {showReset && (
                <Button href="/reports" variant="ghost">
                  Reset all
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Form>

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

      <Suspense
        key={`data|${filterKey}`}
        fallback={
          <div aria-busy="true" className="motion-safe:animate-pulse">
            <span className="sr-only">Loading reports…</span>
            <ReportsDataSkeleton />
          </div>
        }
      >
        <ReportsData
          rangeStart={range.rangeStart}
          rangeEnd={range.rangeEnd}
          rangeShort={range.rangeShort}
          rangePhrase={rangePhrase}
          suiteId={suiteId}
          testerId={testerId}
          suiteNote={suiteNote}
          testerNote={testerNote}
        />
      </Suspense>
    </main>
  );
}
