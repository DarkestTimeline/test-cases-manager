import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { formatId } from "@/lib/displayId";
import { archiveTestCase, restoreTestCase } from "./actions";

export default async function TestCasesList({ searchParams }) {
  const { archived } = await searchParams;
  const showingArchived = archived === "true";

  let query = supabase
    .from("test_cases")
    .select("*")
    .order("created_at", { ascending: false });

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  const { data: testCases, error } = await query;

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <div className="flex gap-2">
          <Link
            href={showingArchived ? "/test-cases" : "/test-cases?archived=true"}
            className="text-sm px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Link>
          <Link
            href="/test-cases/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Test Case
          </Link>
        </div>
      </div>

      {testCases.length === 0 ? (
        <p className="text-gray-500">
          {showingArchived ? "No archived test cases." : "No test cases yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {testCases.map((tc) => (
            <li
              key={tc.id}
              className="border rounded p-4 flex justify-between items-start gap-3"
            >
              <div>
                <h2 className="font-semibold">
                  {tc.seq_number && (
                    <span className="text-gray-400 font-normal mr-2">
                      {formatId("TC", tc.seq_number)}
                    </span>
                  )}
                  {tc.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {tc.expected_result}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {!showingArchived && (
                  <Link
                    href={`/test-cases/${tc.id}/edit`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                )}
                <form
                  action={showingArchived ? restoreTestCase : archiveTestCase}
                >
                  <input type="hidden" name="testCaseId" value={tc.id} />
                  <button
                    type="submit"
                    className={`text-xs px-3 py-1 rounded whitespace-nowrap ${
                      showingArchived
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {showingArchived ? "Restore" : "Archive"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
