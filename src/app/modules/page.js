import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default async function ModulesList() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modules</h1>
        <Link href="/modules/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Module
        </Link>
      </div>

      {modules.length === 0 ? (
        <p className="text-gray-500">No modules yet.</p>
      ) : (
        <ul className="space-y-3">
          {modules.map((mod) => (
            <li key={mod.id} className="border rounded p-4">
              <Link href={`/modules/${mod.id}`} className="font-semibold hover:underline">
                {mod.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1">{mod.description}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}