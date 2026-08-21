import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { formatId } from "@/lib/displayId";
import { archiveTestCase, restoreTestCase } from "./actions";

const PAGE_SIZE = 10;

export default async function TestCasesList({ searchParams }) {
  const { archived, search, page } = await searchParams;
  const showingArchived = archived === "true";
  const currentPage = parseInt(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("test_cases")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  if (search) query = query.ilike("title", `%${search}%`);

  const { data: testCases, error, count } = await query;

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  function buildHref(overrides = {}) {
    const current = { archived: archived || null, search, page: currentPage };
    const merged = { ...current, ...overrides };

    const params = new URLSearchParams();
    if (merged.archived) params.set("archived", merged.archived);
    if (merged.search) params.set("search", merged.search);
    if (merged.page && merged.page > 1) params.set("page", merged.page);

    const qs = params.toString();
    return qs ? `/test-cases?${qs}` : "/test-cases";
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Cases</h1>
        <div className="flex gap-2">
          <Link
            href={buildHref({
              archived: showingArchived ? null : "true",
              page: 1,
            })}
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

      <form method="GET" action="/test-cases" className="flex gap-2 mb-6">
        {showingArchived && (
          <input type="hidden" name="archived" value="true" />
        )}
        <input
          type="text"
          name="search"
          defaultValue={search || ""}
          placeholder="Search by title..."
          className="border rounded p-2 text-sm flex-1 max-w-xs"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Search
        </button>
        {search && (
          <Link
            href={buildHref({ search: null, page: 1 })}
            className="text-sm text-gray-500 hover:underline self-center"
          >
            Clear search
          </Link>
        )}
      </form>

      {testCases.length === 0 ? (
        <p className="text-gray-500">
          {search
            ? "No test cases match your search."
            : showingArchived
              ? "No archived test cases."
              : "No test cases yet."}
        </p>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              {currentPage > 1 ? (
                <Link
                  href={buildHref({ page: currentPage - 1 })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-sm text-gray-300">← Previous</span>
              )}
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={buildHref({ page: currentPage + 1 })}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-sm text-gray-300">Next →</span>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
