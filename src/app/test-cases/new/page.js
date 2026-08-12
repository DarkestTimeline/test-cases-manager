import { createTestCase } from '../actions'

export default function NewTestCase() {
  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Test Case</h1>
      <form action={createTestCase} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" name="title" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preconditions</label>
          <textarea name="preconditions" rows={2} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Steps to Reproduce</label>
          <textarea name="steps_to_reproduce" required rows={4} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expected Result</label>
          <textarea name="expected_result" required rows={2} className="w-full border rounded p-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Test Case
        </button>
      </form>
    </main>
  )
}