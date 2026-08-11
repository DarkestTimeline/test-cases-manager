import { supabase } from '@/lib/supabaseClient'
import { addTestCasesToModule } from '../actions'

export default async function ModuleDetail({ params }) {
  const { id } = await params

  const { data: mod } = await supabase.from('modules').select('*').eq('id', id).single()

  const { data: linkedCases } = await supabase
    .from('module_cases')
    .select('test_case_id, test_cases(*)')
    .eq('module_id', id)

  const { data: allTestCases } = await supabase.from('test_cases').select('*')

  const linkedIds = linkedCases.map((lc) => lc.test_case_id)
  const availableTestCases = allTestCases.filter((tc) => !linkedIds.includes(tc.id))

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold">{mod.name}</h1>
      <p className="text-gray-600 mt-1 mb-6">{mod.description}</p>

      <h2 className="font-semibold mb-2">Test Cases in this Module</h2>
      {linkedCases.length === 0 ? (
        <p className="text-gray-500 mb-6">None yet.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {linkedCases.map((lc) => (
            <li key={lc.test_case_id} className="border rounded p-2">
              {lc.test_cases.title}
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-semibold mb-2">Add More Test Cases</h2>
      {availableTestCases.length === 0 ? (
        <p className="text-gray-500">All test cases are already in this module.</p>
      ) : (
        <form action={addTestCasesToModule} className="space-y-2">
          <input type="hidden" name="moduleId" value={mod.id} />
          {availableTestCases.map((tc) => (
            <label key={tc.id} className="flex items-center gap-2 border rounded p-2">
              <input type="checkbox" name="testCaseIds" value={tc.id} />
              {tc.title}
            </label>
          ))}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2">
            Add Selected
          </button>
        </form>
      )}
    </main>
  )
}