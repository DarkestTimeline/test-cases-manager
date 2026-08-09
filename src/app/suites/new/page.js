import { createSuite } from '../actions'

export default function NewSuite() {
  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Suite</h1>
      <form action={createSuite} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" name="name" required className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" rows={2} className="w-full border rounded p-2" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Suite
        </button>
      </form>
    </main>
  )
}