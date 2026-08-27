import { supabase } from "@/lib/supabaseClient";
import ResultsList from "./ResultsList";
import { completeRun, cancelRun } from "../actions";
import { formatId } from "@/lib/displayId";
import { RUN_STATUS_STYLES, OUTCOME_STYLES } from "@/lib/badgeStyles";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { formatStatusLabel } from "@/lib/formatLabel";
import ConfirmButton from "@/components/ConfirmButton";

export default async function RunDetail({ params }) {
  const { id } = await params;

  const [{ data: run }, { data: results }] = await Promise.all([
    supabase
      .from("test_runs")
      .select("*, suites(name, seq_number)")
      .eq("id", id)
      .single(),
    supabase
      .from("run_results")
      .select("*")
      .eq("test_run_id", id)
      .order("position"),
  ]);

  const passedCount = results.filter((r) => r.status === "pass").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;
  const totalCount = results.length;

  const testCaseIds = results.map((r) => r.test_case_id).filter(Boolean);
  const { data: moduleCases } =
    testCaseIds.length > 0
      ? await supabase
          .from("module_cases")
          .select("test_case_id, modules(id, name)")
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
    <main className="p-8 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1>
          {run.suites.seq_number && (
            <span className="text-slate-400 font-normal mr-2">
              {formatId("S", run.suites.seq_number)}
            </span>
          )}
          {run.suites.name}
        </h1>
        <p className="text-slate-600">Tester: {run.tester_name}</p>
        {run.os && <p className="text-sm text-slate-500">OS: {run.os}</p>}
        {run.build_version && (
          <p className="text-sm text-slate-500">Build: {run.build_version}</p>
        )}
        <p className="text-sm text-slate-500 mt-1">
          Started: {new Date(run.started_at).toLocaleString()}
          {run.completed_at && (
            <> · Completed: {new Date(run.completed_at).toLocaleString()}</>
          )}
        </p>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
          {passedCount} / {totalCount} passed
          <Badge className={RUN_STATUS_STYLES[run.status]}>
            {formatStatusLabel(run.status)}
          </Badge>
          {run.outcome && (
            <Badge className={OUTCOME_STYLES[run.outcome]}>
              {formatStatusLabel(run.outcome)}
            </Badge>
          )}
        </p>
      </div>

      <ResultsList
        moduleGroups={moduleGroups}
        ungroupedResults={ungrouped}
        runId={id}
        isLocked={!isActive}
      />

      {isActive && (
        <div className="mt-6 border-t pt-4 space-y-4">
          {pendingCount > 0 ? (
            <p className="text-sm text-slate-500">
              {pendingCount} test case{pendingCount !== 1 ? "s" : ""} still
              pending — mark all results before completing this run.
            </p>
          ) : (
            <form action={completeRun} className="space-y-2">
              <input type="hidden" name="runId" value={run.id} />
              <p className="text-sm font-medium">Mark this run as:</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" name="outcome" value="pass" required />{" "}
                  Pass
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" name="outcome" value="fail" /> Fail
                </label>
              </div>
              <Button type="submit" variant="dark">
                Complete Run
              </Button>
            </form>
          )}
          <form action={cancelRun}>
            <input type="hidden" name="runId" value={run.id} />
            <ConfirmButton
              message="Cancel this run? This cannot be undone."
              variant="dangerOutline"
            >
              Cancel This Run
            </ConfirmButton>
          </form>
        </div>
      )}
    </main>
  );
}
