"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseIdParam } from "@/lib/params";
import { findProjectByCode } from "@/lib/projectAction";

const KINDS = ["test_case", "module", "suite"];

async function resolveRequest(kind, id, targetCode) {
  if (!KINDS.includes(kind)) return { error: "Unknown item type." };

  const itemId = parseIdParam(id);
  if (!itemId) return { error: "This item could not be identified." };

  const supabase = await createClient();
  const target = await findProjectByCode(supabase, targetCode);
  if (!target) {
    return { error: "That project is archived or no longer exists." };
  }

  return { supabase, itemId, target };
}

// What a clone would copy, for the confirmation dialog. Writes nothing.
export async function previewClone(kind, id, targetCode) {
  const request = await resolveRequest(kind, id, targetCode);
  if (request.error) return { error: request.error };

  const { data, error } = await request.supabase.rpc("clone_preview", {
    p_kind: kind,
    p_id: request.itemId,
    p_target_project_id: request.target.id,
  });
  if (error) return { error: error.message };

  return { preview: data };
}

// Copies the item into the target project in a single database transaction.
export async function cloneToProject(kind, id, targetCode) {
  const request = await resolveRequest(kind, id, targetCode);
  if (request.error) return { error: request.error };

  const { data, error } = await request.supabase.rpc("clone_to_project", {
    p_kind: kind,
    p_id: request.itemId,
    p_target_project_id: request.target.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/projects", "page");
  revalidatePath("/projects/[code]", "page");
  revalidatePath("/projects/[code]/test-cases", "page");
  revalidatePath("/projects/[code]/modules", "page");
  revalidatePath("/projects/[code]/suites", "page");

  const base = `/projects/${request.target.code}`;
  const path =
    kind === "test_case"
      ? `${base}/test-cases/${data.id}/edit`
      : `${base}/${kind === "module" ? "modules" : "suites"}/${data.id}`;

  return { path };
}
