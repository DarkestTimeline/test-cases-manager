import { supabase } from '@/lib/supabaseClient'
import ResultsList from './ResultsList'
import { completeRun } from '../actions'

const OUTCOME_STYLES = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-600',
}

export default async function RunDetail({ params }) {
  const { id } = await params

  const [{ data: run }, { data: results }] = await Promise.all([
    supabase.from('test_runs').select('*, suites(name)').eq('id', id).single(),
    supabase.from('run_results').select('*').eq('test_run_id', id).order('title'),
  ])

  const passedCount = results.filter((r) => r.status === 'pass').length
  const pendingCount = results.filter((r) => r.status === 'pending').length
  const totalCount = results.length

  const testCaseIds = results.map((r) => r.test_case_id).filter(Boolean)

  const { data: moduleCases } =
    testCaseIds.length > 0
      ? await supabase.from('module_cases').select('test_case_id, modules(id, name)').in('test_case_id', testCaseIds)
      : { data: [] }

  const moduleByTestCaseId = {}
  moduleCases.forEach((mc) => {
    moduleByTestCaseId[mc.test_case_id] = mc.modules
  })

  const grouped = {}
  const ungrouped = []

  results.forEach((r) => {
    const mod = r.test_case_id ? moduleByTestCaseId[r.test_case_id] : null
    if (mod) {
      if (!grouped[mod.id]) {
        grouped[mod.id] = { module: mod, results: [] }
      }
      grouped[mod.id].results.push(r)
    } else {
      ungrouped.push(r)
    }
  })

  const moduleGroups = Object.values(grouped)

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{run.suites.name}</h1>
        <p className="text-gray-600">Tester: {run.tester_name}</p>
        {run.os && <p className="text-sm text-gray-500">OS: {run.os}</p>}
        {run.build_version && <p className="text-sm text-gray-500">Build: {run.build_version}</p>}
        <p className="text-sm text-gray-500 mt-1">
          Started: {new Date(run.started_at).toLocaleString()}
          {run.completed_at && <> · Completed: {new Date(run.completed_at).toLocaleString()}</>}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {passedCount} / {totalCount} passed · Run status: {run.status}
          {run.outcome && (
            <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${OUTCOME_STYLES[run.outcome]}`}>
              {run.outcome}
            </span>
          )}
        </p>
      </div>

      <ResultsList
        moduleGroups={moduleGroups}
        ungroupedResults={ungrouped}
        runId={id}
        isLocked={run.status === 'completed'}
      />

      {run.status !== 'completed' && (
        pendingCount > 0 ? (
          <p className="mt-6 text-sm text-gray-500 border-t pt-4">
            {pendingCount} test case{pendingCount !== 1 ? 's' : ''} still pending — mark all results before completing this run.
          </p>
        ) : (
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
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 text-sm">
              Complete Run
            </button>
          </form>
        )
      )}
    </main>
  )
}