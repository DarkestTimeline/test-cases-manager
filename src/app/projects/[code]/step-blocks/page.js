import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatId } from "@/lib/displayId";
import { archiveStepBlock, restoreStepBlock } from "./actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { buildSearchFilter } from "@/lib/searchFilter";
import { PAGE } from "@/lib/pageWidths";
import { getProject, getActiveProjects } from "@/lib/project";
import RowMenu from "@/components/RowMenu";
import { normalizeSteps, cleanSteps } from "@/lib/steps";
import { richTextToPlainText } from "@/lib/richText";

const PAGE_SIZE = 10;

export const metadata = { title: "Step Blocks" };

export default async function StepBlocksList({ params, searchParams }) {
  const { code } = await params;
  const project = await getProject(code);
  const base = `/projects/${project.code}`;
  const otherProjects = (await getActiveProjects()).filter(
    (p) => p.code !== project.code,
  );
  const supabase = await createClient();
  const { archived, search, page } = await searchParams;
  const showingArchived = archived === "true";
  const currentPage = parseInt(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("step_blocks")
    .select("id, seq_number, title, steps, archived_at", { count: "exact" })
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .order("seq_number", { ascending: false })
    .range(from, to);

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  if (search) {
    query = query.or(
      buildSearchFilter(search, {
        prefix: "SB",
        columns: ["title", "steps_text"],
      }),
    );
  }

  const { data: blocks, error, count } = await query;

  if (error) return <p className="p-8 text-red-600">Error: {error.message}</p>;

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  function buildHref(overrides = {}) {
    const current = { archived: archived || null, search, page: currentPage };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    if (merged.archived) params.set("archived", merged.archived);
    if (merged.search) params.set("search", merged.search);
    if (merged.page && merged.page > 1) params.set("page", merged.page);
    const qs = params.toString();
    return qs ? `${base}/step-blocks?${qs}` : `${base}/step-blocks`;
  }

  return (
    <main className={PAGE.wide}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
        <h1>Step Blocks</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            href={buildHref({
              archived: showingArchived ? null : "true",
              page: 1,
            })}
            variant="secondary"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Button>
          <Button href={`${base}/step-blocks/new`}>+ New Step Block</Button>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Reusable sets of steps you can add to many test cases.
      </p>

      <form
        method="GET"
        action={`${base}/step-blocks`}
        className="flex gap-2 mb-6"
      >
        {showingArchived && (
          <input type="hidden" name="archived" value="true" />
        )}
        <input
          type="text"
          name="search"
          defaultValue={search || ""}
          placeholder="Search by title, steps or code..."
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

      {blocks.length === 0 ? (
        <p className="text-gray-500">
          {search
            ? "No step blocks match your search."
            : showingArchived
              ? "No archived step blocks."
              : "No step blocks yet."}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {blocks.map((block) => {
              const steps = normalizeSteps(cleanSteps(block.steps));
              const firstStep = steps[0]
                ? richTextToPlainText(steps[0].action)
                : "";
              return (
                <Card
                  key={block.id}
                  className="flex justify-between items-start gap-3"
                >
                  <Link
                    href={`${base}/step-blocks/${block.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="font-semibold">
                      {block.seq_number && (
                        <span className="text-slate-400 font-normal mr-2">
                          {formatId("SB", block.seq_number)}
                        </span>
                      )}
                      {block.title}
                    </span>
                    {firstStep && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {firstStep}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {steps.length} step{steps.length === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-start gap-2">
                    <RowMenu
                      kind="step_block"
                      id={block.id}
                      projects={otherProjects}
                      archived={showingArchived}
                      archiveAction={archiveStepBlock}
                      restoreAction={restoreStepBlock}
                      idField="stepBlockId"
                    />
                  </div>
                </Card>
              );
            })}
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
