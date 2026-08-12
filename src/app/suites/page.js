import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default async function SuitesList() {
  const { data: suites, error } = await supabase
    .from('suites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suites</h1>
        <Link href="/suites/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Suite
        </Link>
      </div>

      {suites.length === 0 ? (
        <p className="text-gray-500">No suites yet.</p>
      ) : (
        <ul className="space-y-3">
          {suites.map((suite) => (
            <li key={suite.id} className="border rounded p-4">
              <Link href={`/suites/${suite.id}`} className="font-semibold hover:underline">
                {suite.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1">{suite.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}