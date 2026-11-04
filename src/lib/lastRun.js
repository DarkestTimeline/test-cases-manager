// Summary of a project's / suite's most recent run for list rows and cards:
// { text, dot, at } where `at` is an ISO timestamp to show with <LocalTime>.
export function lastRunInfo(run) {
  if (!run) return { text: "No runs yet", dot: "bg-slate-300" };
  if (run.status === "in_progress") {
    return { text: "Run in progress · started", dot: "bg-blue-500", at: run.started_at };
  }
  if (run.outcome === "pass") {
    return { text: "Last run passed ·", dot: "bg-emerald-500", at: run.started_at };
  }
  if (run.outcome === "fail") {
    return { text: "Last run failed ·", dot: "bg-red-500", at: run.started_at };
  }
  return { text: "Last run", dot: "bg-slate-400", at: run.started_at };
}
