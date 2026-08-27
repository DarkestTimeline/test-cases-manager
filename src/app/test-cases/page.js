import { supabase } from "@/lib/supabaseClient";
import { formatId } from "@/lib/displayId";
import { archiveTestCase, restoreTestCase } from "./actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";

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
        <h1>Test Cases</h1>
        <div className="flex gap-2">
          <Button
            href={buildHref({
              archived: showingArchived ? null : "true",
              page: 1,
            })}
            variant="secondary"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Button>
          <Button href="/test-cases/new" variant="primary">
            + New Test Case
          </Button>
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
        <Button type="submit" variant="primary">
          Search
        </Button>
        {search && (
          <Button
            href={buildHref({ search: null, page: 1 })}
            variant="ghost"
            className="self-center"
          >
            Clear search
          </Button>
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
              <Card
                key={tc.id}
                className="flex justify-between items-start gap-3"
              >
                <div>
                  <Link
                    href={`/test-cases/${tc.id}/edit`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {tc.seq_number && (
                      <span className="text-slate-400 font-normal mr-2">
                        {formatId("TC", tc.seq_number)}
                      </span>
                    )}
                    {tc.title}
                  </Link>
                  <p className="text-sm text-slate-600 mt-1">
                    {tc.expected_result}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <form
                    action={showingArchived ? restoreTestCase : archiveTestCase}
                  >
                    <input type="hidden" name="testCaseId" value={tc.id} />
                    <Button
                      type="submit"
                      variant={showingArchived ? "success" : "secondary"}
                      className="text-xs px-3 py-1"
                    >
                      {showingArchived ? "Restore" : "Archive"}
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              {currentPage > 1 ? (
                <Button
                  href={buildHref({ page: currentPage - 1 })}
                  variant="ghost"
                >
                  ← Previous
                </Button>
              ) : (
                <span className="text-sm text-gray-300">← Previous</span>
              )}
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Button
                  href={buildHref({ page: currentPage + 1 })}
                  variant="ghost"
                >
                  Next →
                </Button>
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
