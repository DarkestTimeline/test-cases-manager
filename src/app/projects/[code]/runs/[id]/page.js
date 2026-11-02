import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/project";
import { parseIdParam } from "@/lib/params";
import ResultsList from "./ResultsList";
import { completeRun, cancelRun } from "../actions";
import { formatId } from "@/lib/displayId";
import { RUN_STATUS_STYLES, OUTCOME_STYLES } from "@/lib/badgeStyles";
import Badge from "@/components/Badge";
import { formatStatusLabel } from "@/lib/formatLabel";
import ConfirmButton from "@/components/ConfirmButton";
import BackLink from "@/components/BackLink";
import ProgressBar from "@/components/ProgressBar";
import Card from "@/components/Card";
import { PAGE } from "@/lib/pageWidths";

const STATUS_ROWS = [
  { key: "pass", label: "Passed", color: "#059669" },
  { key: "fail", label: "Failed", color: "#dc2626" },
  { key: "blocked", label: "Blocked", color: "#d97706" },
  { key: "skipped", label: "Skipped", color: "#9333ea" },
  { key: "pending", label: "Pending", color: "#cbd5e1" },
];

function MetaRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

// Complete / cancel controls. Shown in the side panel on wide screens and
// below the results on narrow ones.
function RunActions({ run, pendingCount }) {
  return (
    <Card>
      {pendingCount > 0 ? (
        <p className="text-sm text-slate-500">
          {pendingCount} test case{pendingCount !== 1 ? "s" : ""} still pending
          — mark all results before completing this run.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium mb-3">Mark this run as:</p>
          <div className="flex gap-3">
            <form action={completeRun} className="flex-1">
              <input type="hidden" name="runId" value={run.id} />
              <input type="hidden" name="outcome" value="pass" />
              <ConfirmButton
                message="Mark this run as Pass and complete it?"
                variant="success"
                confirmVariant="success"
                className="w-full"
              >
                {" "}
                ✓ Pass
              </ConfirmButton>
            </form>
            <form action={completeRun} className="flex-1">
              <input type="hidden" name="runId" value={run.id} />
              <input type="hidden" name="outcome" value="fail" />
              <ConfirmButton
                message="Mark this run as Fail and complete it?"
                variant="danger"
                className="w-full"
              >
                ✕ Fail
              </ConfirmButton>
            </form>
          </div>
        </>
      )}
      <div className="mt-4 pt-4 border-t">
        <form action={cancelRun}>
          <input type="hidden" name="runId" value={run.id} />
          <ConfirmButton
            message="Cancel this run? This cannot be undone."
            variant="dangerOutline"
            className="w-full"
          >
            Cancel This Run
          </ConfirmButton>
        </form>
      </div>
    </Card>
  );
}

export default async function RunDetail({ params }) {
  const supabase = await createClient();
  const { code, id: rawId } = await params;
  const project = await getProject(code);
  const id = parseIdParam(rawId);
  if (!id) notFound();

  const [{ data: run }, { data: results }] = await Promise.all([
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .eq("id", id)
      .eq("project_id", project.id)
      .maybeSingle(),
    supabase
      .from("run_results")
      .select("*")
      .eq("test_run_id", id)
      .order("position"),
  ]);
  if (!run) notFound();

  const counts = {
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    blocked: results.filter((r) => r.status === "blocked").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    pending: results.filter((r) => r.status === "pending").length,
  };
  const totalCount = results.length;

  const testCaseIds = results.map((r) => r.test_case_id).filter(Boolean);
  const { data: moduleCases } =
    testCaseIds.length > 0
      ? await supabase
          .from("module_cases")
          .select("test_case_id, modules(id, name)")
          .eq("project_id", project.id)
          .in("test_case_id", testCaseIds)
      : { data: [] };

  const moduleByTestCaseId = {};
  moduleCases.forEach((mc) => {
    moduleByTestCaseId[mc.test_case_id] = mc.modules;
  });

  const grouped = {};
  const ungrouped = [];
  results.forEach((r) => {
    const mod = r.test_case_id ? moduleByTestCaseId[r.test_case_id] : null;
    if (mod) {
      if (!grouped[mod.id]) grouped[mod.id] = { module: mod, results: [] };
      grouped[mod.id].results.push(r);
    } else {
      ungrouped.push(r);
    }
  });
  const moduleGroups = Object.values(grouped);
  const isActive = run.status === "in_progress";

  return (
    <main className={PAGE.full}>
      <BackLink
        href={`/projects/${project.code}/runs`}
        label="Runs Dashboard"
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-8">
          <Card className="space-y-5">
            <div>
              {run.suites.seq_number && (
                <p className="text-sm text-slate-400">
                  {formatId("S", run.suites.seq_number)}
                </p>
              )}
              <h1 className="text-xl">{run.suites.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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

            <div>
              <p className="mb-2 flex justify-between text-sm">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium text-slate-800">
                  {counts.pass} / {totalCount} passed
                </span>
              </p>
              <ProgressBar counts={counts} total={totalCount} />
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {STATUS_ROWS.map((row) => (
                  <li key={row.key} className="flex items-center gap-2">
                    <span
                      data-segment={row.key}
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-slate-500">{row.label}</span>
                    <span className="ml-auto font-medium text-slate-800">
                      {counts[row.key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-2 border-t pt-4 text-sm">
              <MetaRow label="Tester" value={run.tester_name} />
              {run.os && <MetaRow label="OS" value={run.os} />}
              {run.build_version && (
                <MetaRow label="Build" value={run.build_version} />
              )}
              <MetaRow
                label="Started"
                value={new Date(run.started_at).toLocaleString()}
              />
              {run.completed_at && (
                <MetaRow
                  label="Completed"
                  value={new Date(run.completed_at).toLocaleString()}
                />
              )}
            </dl>
          </Card>

          {isActive && (
            <div className="hidden lg:block">
              <RunActions run={run} pendingCount={counts.pending} />
            </div>
          )}
        </aside>

        <div className="min-w-0">
          <ResultsList
            moduleGroups={moduleGroups}
            ungroupedResults={ungrouped}
            runId={id}
            isLocked={!isActive}
          />

          {isActive && (
            <div className="mt-6 lg:hidden">
              <RunActions run={run} pendingCount={counts.pending} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
