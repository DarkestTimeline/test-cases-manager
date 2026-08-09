import { supabase } from "@/lib/supabaseClient";
import ResultsList from "./ResultsList";
import { completeRun } from "../actions";

const OUTCOME_STYLES = {
  pass: "bg-green-100 text-green-700",
  fail: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function RunDetail({ params }) {
  const { id } = await params;

  const { data: run } = await supabase
    .from("test_runs")
    .select("*, suites(name)")
    .eq("id", id)
    .single();

  const { data: results } = await supabase
    .from("run_results")
    .select("*")
    .eq("test_run_id", id)
    .order("title");

  const passedCount = results.filter((r) => r.status === "pass").length;
  const totalCount = results.length;

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{run.suites.name}</h1>
        <p className="text-gray-600">Tester: {run.tester_name}</p>
        {run.os && <p className="text-sm text-gray-500">OS: {run.os}</p>}
        {run.build_version && (
          <p className="text-sm text-gray-500">Build: {run.build_version}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Started: {new Date(run.started_at).toLocaleString()}
          {run.completed_at && (
            <> · Completed: {new Date(run.completed_at).toLocaleString()}</>
          )}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {passedCount} / {totalCount} passed · Run status: {run.status}
          {run.outcome && (
            <span
              className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${OUTCOME_STYLES[run.outcome]}`}
            >
              {run.outcome}
            </span>
          )}
        </p>
      </div>

      <ResultsList results={results} runId={id} />

      {run.status !== "completed" && (
        <form action={completeRun} className="mt-6 space-y-2 border-t pt-4">
          <input type="hidden" name="runId" value={run.id} />
          <p className="text-sm font-medium">Mark this run as:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="outcome" value="pass" required /> Pass
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="outcome" value="fail" /> Fail
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="outcome" value="cancelled" /> Cancelled
            </label>
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 text-sm"
          >
            Complete Run
          </button>
        </form>
      )}
    </main>
  );
}
