import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatId } from "@/lib/displayId";
import { archiveTestCase, restoreTestCase } from "./actions";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import CollapsibleFilters from "@/components/CollapsibleFilters";
import { PRIORITY_STYLES } from "@/lib/badgeStyles";
import { formatStatusLabel } from "@/lib/formatLabel";

const PAGE_SIZE = 10;

export default async function TestCasesList({ searchParams }) {
  const supabase = await createClient();
  const { archived, search, page, priority, moduleId } = await searchParams;
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

  if (search)
    query = query.or(
      `title.ilike.%${search}%,steps_to_reproduce.ilike.%${search}%,expected_result.ilike.%${search}%`,
    );
  if (priority) query = query.eq("priority", priority);

  if (moduleId) {
    const { data: moduleCaseIds } = await supabase
      .from("module_cases")
      .select("test_case_id")
      .eq("module_id", moduleId);
    const ids = (moduleCaseIds || []).map((mc) => mc.test_case_id);
    query =
      ids.length > 0
        ? query.in("id", ids)
        : query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data: testCases, error, count } = await query;

  if (error) {
    return <p className="p-8 text-danger">Error: {error.message}</p>;
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .is("archived_at", null)
    .order("name");

  function buildHref(overrides = {}) {
    const current = {
      archived: archived || null,
      search,
      page: currentPage,
      priority,
      moduleId,
    };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.archived) params.set("archived", merged.archived);
    if (merged.search) params.set("search", merged.search);
    if (merged.priority) params.set("priority", merged.priority);
    if (merged.moduleId) params.set("moduleId", merged.moduleId);
    if (merged.page && merged.page > 1) params.set("page", merged.page);
    const qs = params.toString();
    return qs ? `/test-cases?${qs}` : "/test-cases";
  }

  const advancedFilterCount = [priority, moduleId].filter(Boolean).length;

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1>Test Cases</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            href={buildHref({
              archived: showingArchived ? null : "true",
              page: 1,
            })}
            variant="secondary"
            size="sm"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Button>
          <Button href="/test-cases/new">+ New Test Case</Button>
        </div>
      </div>

      <form method="GET" action="/test-cases" className="flex gap-2 mb-2">
        {showingArchived && (
          <input type="hidden" name="archived" value="true" />
        )}
        {priority && <input type="hidden" name="priority" value={priority} />}
        {moduleId && <input type="hidden" name="moduleId" value={moduleId} />}
        <input
          type="text"
          name="search"
          defaultValue={search || ""}
          placeholder="Search title, steps, or expected result..."
          className="border rounded p-2 text-sm flex-1 max-w-xs"
        />
        <Button type="submit">Search</Button>
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

      <CollapsibleFilters activeCount={advancedFilterCount}>
        <form
          method="GET"
          action="/test-cases"
          className="flex flex-col sm:flex-row gap-2 sm:items-center"
        >
          {showingArchived && (
            <input type="hidden" name="archived" value="true" />
          )}
          {search && <input type="hidden" name="search" value={search} />}
          <select
            name="priority"
            defaultValue={priority || ""}
            className="border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Any Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            name="moduleId"
            defaultValue={moduleId || ""}
            className="border rounded p-2 text-sm h-9 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Any Module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button type="submit" className="w-full sm:w-auto">
            Filter
          </Button>
          {advancedFilterCount > 0 && (
            <Button
              href={buildHref({ priority: null, moduleId: null, page: 1 })}
              variant="ghost"
            >
              Clear
            </Button>
          )}
        </form>
      </CollapsibleFilters>

      {testCases.length === 0 ? (
        <p className="text-slate-500">
          {search || advancedFilterCount > 0
            ? "No test cases match your filters."
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
                  <Badge className={`${PRIORITY_STYLES[tc.priority]} ml-2`}>
                    {formatStatusLabel(tc.priority)}
                  </Badge>
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
                      size="sm"
                    >
                      {showingArchived ? "Restore" : "Archive"}
                    </Button>
                  </form>
                </div>
              </li>
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
                <span className="text-sm text-slate-300">← Previous</span>
              )}
              <span className="text-sm text-slate-500">
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
                <span className="text-sm text-slate-300">Next →</span>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
