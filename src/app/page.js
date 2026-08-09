import Link from 'next/link'

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">QA Test Manager</h1>
      <p className="text-gray-600 mb-6">Manage test cases, build suites, and run them.</p>
      <Link href="/runs" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Go to Dashboard
      </Link>
    </main>
  )
}