// Server-side helpers for finding Step Blocks in the database. They take the
// Supabase client as an argument, so they work from pages and server actions.

import { blockIdsIn, cleanSteps, normalizeSteps, stepsToText } from "./steps";

const COLUMNS = "id, seq_number, title, steps, archived_at";
const ID_CHUNK = 100; // ids per request, to keep the URL short
const MAX_FORM_BLOCKS = 300; // blocks offered in the picker
const UPDATE_BATCH = 20;

// { byId, error }: the blocks with these ids in one project. Archived blocks
// are included: a test case keeps using a block after it is archived.
export async function fetchBlocksById(supabase, projectId, ids) {
  const byId = {};
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const { data, error } = await supabase
      .from("step_blocks")
      .select(COLUMNS)
      .eq("project_id", projectId)
      .in("id", ids.slice(i, i + ID_CHUNK));
    if (error) return { byId, error };
    for (const block of data ?? []) byId[block.id] = block;
  }
  return { byId, error: null };
}

// The blocks a test case form needs: every active block (for the picker) plus
// any archived block the case already uses (so it still displays).
export async function loadBlocksForForm(supabase, projectId, referencedIds = []) {
  const { data } = await supabase
    .from("step_blocks")
    .select(COLUMNS)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("seq_number")
    .limit(MAX_FORM_BLOCKS);
  const blocks = data ?? [];

  const have = new Set(blocks.map((block) => block.id));
  const missing = referencedIds.filter((id) => !have.has(id));
  if (missing.length > 0) {
    const { byId } = await fetchBlocksById(supabase, projectId, missing);
    blocks.push(...Object.values(byId));
  }
  return blocks;
}

// Looks up every block a list of steps refers to.
// Returns { blocksById, missingIds, error }.
export async function resolveBlocks(supabase, projectId, steps) {
  const ids = blockIdsIn(steps);
  if (ids.length === 0) return { blocksById: {}, missingIds: [], error: null };
  const { byId, error } = await fetchBlocksById(supabase, projectId, ids);
  return {
    blocksById: byId,
    missingIds: ids.filter((id) => !byId[id]),
    error,
  };
}

// A test case's search text includes the text of the blocks it uses. When a
// block changes, bring the search text of the cases that use it up to date.
// Returns an error message, or null.
export async function refreshStepsText(supabase, projectId, blockId) {
  const { data: cases, error } = await supabase
    .from("test_cases")
    .select("id, steps")
    .eq("project_id", projectId)
    .contains("steps", [{ block_id: blockId }]);
  if (error) return error.message;
  if (!cases || cases.length === 0) return null;

  const lists = cases.map((c) => normalizeSteps(cleanSteps(c.steps)));
  const ids = [...new Set(lists.flatMap((steps) => blockIdsIn(steps)))];
  const { byId, error: blocksError } = await fetchBlocksById(supabase, projectId, ids);
  if (blocksError) return blocksError.message;

  for (let i = 0; i < cases.length; i += UPDATE_BATCH) {
    const results = await Promise.all(
      cases.slice(i, i + UPDATE_BATCH).map((c, j) =>
        supabase
          .from("test_cases")
          .update({ steps_text: stepsToText(lists[i + j], byId) })
          .eq("id", c.id),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed) return failed.error.message;
  }
  return null;
}
