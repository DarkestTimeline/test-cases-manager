import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { formatId } from "@/lib/displayId";

export default async function TestCasesList() {
  const { data: testCases, error } = await supabase
    .from("test_cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <Link
          href="/test-cases/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Test Case
        </Link>
      </div>

      {testCases.length === 0 ? (
        <p className="text-gray-500">No test cases yet.</p>
      ) : (
        <ul className="space-y-3">
          {testCases.map((tc) => (
            <li key={tc.id} className="border rounded p-4">
              <h2 className="font-semibold">
                {tc.seq_number && (
                  <span className="text-gray-400 font-normal mr-2">
                    {formatId("TC", tc.seq_number)}
                  </span>
                )}
                {tc.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{tc.expected_result}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
