import RichTextView from "@/components/RichTextView";
import { formatId } from "@/lib/displayId";
import { cleanSteps, isBlockRef, normalizeSteps } from "@/lib/steps";

// Read-only numbered list of a test case's steps (action, data, expected
// result). Steps that came from a Step Block (run snapshots) get a small
// "From SB-01 ..." caption above the first step of each block. No hooks, so
// it works in server and client components.
export default function StepsView({ steps }) {
  // References are not shown: they have no content here (runs store expanded steps).
  const list = normalizeSteps(cleanSteps(steps)).filter((step) => !isBlockRef(step));
  if (list.length === 0) return null;

  return (
    <ol className="space-y-3">
      {list.map((step, index) => {
        const block = step.from_block;
        const startsBlock = block && block.id !== list[index - 1]?.from_block?.id;
        return (
          <li key={step.id} className="flex gap-3">
            <span className="w-5 shrink-0 pt-px text-right text-sm text-slate-400">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 text-sm">
              {startsBlock && (
                <p className="text-xs text-slate-500">
                  From{" "}
                  <span className="font-medium">
                    {block.seq_number ? `${formatId("SB", block.seq_number)} ` : ""}
                    {block.title}
                  </span>
                </p>
              )}
              <RichTextView value={step.action} />
              {step.data && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Data
                  </span>
                  <RichTextView value={step.data} className="text-slate-600" />
                </div>
              )}
              {step.expected && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Expected result
                  </span>
                  <RichTextView value={step.expected} className="text-slate-600" />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
