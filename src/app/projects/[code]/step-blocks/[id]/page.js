import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/project";
import { parseIdParam } from "@/lib/params";
import { formatId } from "@/lib/displayId";
import { cleanSteps } from "@/lib/steps";
import { updateStepBlock } from "../actions";
import StepBlockForm from "@/components/StepBlockForm";
import Badge from "@/components/Badge";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import { PAGE } from "@/lib/pageWidths";

export const metadata = { title: "Edit Step Block" };

export default async function EditStepBlock({ params }) {
  const { code, id: rawId } = await params;
  const project = await getProject(code);
  const id = parseIdParam(rawId);
  if (!id) notFound();
  const supabase = await createClient();

  const { data: block } = await supabase
    .from("step_blocks")
    .select("*")
    .eq("id", id)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!block) notFound();

  // Blocks are shared, so say plainly where this one is used.
  const base = `/projects/${project.code}`;
  const { data: usedIn, count: usedCount } = await supabase
    .from("test_cases")
    .select("id, seq_number, title", { count: "exact" })
    .eq("project_id", project.id)
    .is("archived_at", null)
    .contains("steps", [{ block_id: block.id }])
    .order("seq_number")
    .limit(10);

  return (
    <main className={PAGE.wide}>
      <BackLink
        href={`/projects/${project.code}/step-blocks`}
        label="Step Blocks"
      />
      <div className="flex items-center gap-2 mb-4">
        <Badge
          className={
            block.archived_at
              ? "bg-slate-200 text-slate-600"
              : "bg-emerald-100 text-emerald-700"
          }
        >
          {block.archived_at ? "Archived" : "Active"}
        </Badge>
        {block.seq_number && (
          <span className="text-slate-400 text-sm">
            {formatId("SB", block.seq_number)}
          </span>
        )}
      </div>
      <h1 className="mb-6">Edit Step Block</h1>
      {block.archived_at && (
        <p className="mb-4 text-sm text-slate-600">
          This step block is archived. Restore it from the list to use it.
        </p>
      )}
      {usedCount > 0 && (
        <section
          aria-label="Where this step block is used"
          className="mb-6 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p>
            Used in {usedCount} test case{usedCount === 1 ? "" : "s"}. Changes
            you save here apply to all of them.
          </p>
          <ul className="mt-2 space-y-0.5">
            {usedIn.map((tc) => (
              <li key={tc.id}>
                <Link
                  href={`${base}/test-cases/${tc.id}/edit`}
                  className="underline"
                >
                  {formatId(project.code, tc.seq_number)} {tc.title}
                </Link>
              </li>
            ))}
          </ul>
          {usedCount > usedIn.length && (
            <p className="mt-1">…and {usedCount - usedIn.length} more.</p>
          )}
        </section>
      )}
      <StepBlockForm
        action={updateStepBlock}
        hiddenFields={{ projectCode: project.code, stepBlockId: block.id }}
        initialValues={{ title: block.title, steps: cleanSteps(block.steps) }}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
      />
    </main>
  );
}
