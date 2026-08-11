import { supabase } from "@/lib/supabaseClient";
import { startRun } from "../actions";

export default async function NewRun() {
  const { data: suites } = await supabase
    .from("suites")
    .select("*")
    .order("name");

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Start a Run</h1>

      {suites.length === 0 ? (
        <p className="text-gray-500">No suites exist yet — create one first.</p>
      ) : (
        <form action={startRun} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Suite</label>
            <select
              name="suiteId"
              required
              className="w-full border rounded p-2"
            >
              {suites.map((suite) => (
                <option key={suite.id} value={suite.id}>
                  {suite.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OS</label>
            <input
              type="text"
              name="os"
              placeholder="e.g. macOS 15, Windows 11"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Build / Version
            </label>
            <input
              type="text"
              name="build_version"
              placeholder="e.g. v2.4.1"
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Tester Name
            </label>
            <input
              type="text"
              name="testerName"
              required
              className="w-full border rounded p-2"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Start Run
          </button>
        </form>
      )}
    </main>
  );
}
