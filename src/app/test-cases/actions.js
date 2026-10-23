"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateRow } from "@/lib/testCaseValidation";
import { parseIdParam } from "@/lib/params";

const VALID_PRIORITIES = ["low", "medium", "high", "critical"];
const EXPORT_PAGE_SIZE = 1000;
const EXPORT_MAX_PAGES = 200;

export async function createTestCase(formData) {
  const supabase = await createClient();
  const title = formData.get("title");
  const preconditions = formData.get("preconditions");
  const steps_to_reproduce = formData.get("steps_to_reproduce");
  const expected_result = formData.get("expected_result");
  const moduleIds = formData.getAll("moduleIds");
  const priority = formData.get("priority");

  const { data: testCase, error } = await supabase
    .from("test_cases")
    .insert({
      title,
      preconditions,
      steps_to_reproduce,
      expected_result,
      priority,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (moduleIds.length > 0) {
    const rowsToInsert = moduleIds.map((moduleId) => ({
      module_id: moduleId,
      test_case_id: testCase.id,
    }));
    const { error: moduleError } = await supabase
      .from("module_cases")
      .insert(rowsToInsert);
    if (moduleError) throw new Error(moduleError.message);
  }

  revalidatePath("/test-cases");
  redirect("/test-cases");
}

export async function updateTestCase(formData) {
  const supabase = await createClient();
  const testCaseId = formData.get("testCaseId");
  const title = formData.get("title");
  const preconditions = formData.get("preconditions");
  const steps_to_reproduce = formData.get("steps_to_reproduce");
  const expected_result = formData.get("expected_result");
  const priority = formData.get("priority");
  const moduleIds = formData.getAll("moduleIds");

  const { error } = await supabase
    .from("test_cases")
    .update({
      title,
      preconditions,
      steps_to_reproduce,
      expected_result,
      priority,
    })
    .eq("id", testCaseId);

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("module_cases")
    .delete()
    .eq("test_case_id", testCaseId);
  if (deleteError) throw new Error(deleteError.message);

  if (moduleIds.length > 0) {
    const rowsToInsert = moduleIds.map((moduleId) => ({
      module_id: moduleId,
      test_case_id: testCaseId,
    }));
    const { error: insertError } = await supabase
      .from("module_cases")
      .insert(rowsToInsert);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/test-cases");
  redirect("/test-cases");
}

export async function archiveTestCase(formData) {
  const supabase = await createClient();
  const testCaseId = formData.get("testCaseId");

  const { error } = await supabase
    .from("test_cases")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", testCaseId);
  if (error) throw new Error(error.message);

  revalidatePath("/test-cases");
}

export async function restoreTestCase(formData) {
  const supabase = await createClient();
  const testCaseId = formData.get("testCaseId");

  const { error } = await supabase
    .from("test_cases")
    .update({ archived_at: null })
    .eq("id", testCaseId);
  if (error) throw new Error(error.message);

  revalidatePath("/test-cases");
}

export async function cloneTestCase(formData) {
  const supabase = await createClient();
  const testCaseId = formData.get("testCaseId");

  const { data: source } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", testCaseId)
    .single();

  const { data: clone, error } = await supabase
    .from("test_cases")
    .insert({
      title: `${source.title} (Copy)`,
      preconditions: source.preconditions,
      steps_to_reproduce: source.steps_to_reproduce,
      expected_result: source.expected_result,
      priority: source.priority,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: moduleLinks } = await supabase
    .from("module_cases")
    .select("module_id")
    .eq("test_case_id", testCaseId);

  for (const link of moduleLinks) {
    const { data: existing } = await supabase
      .from("module_cases")
      .select("position")
      .eq("module_id", link.module_id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      existing && existing.length > 0 ? existing[0].position + 1 : 0;

    await supabase.from("module_cases").insert({
      module_id: link.module_id,
      test_case_id: clone.id,
      position: nextPosition,
    });
  }

  revalidatePath("/test-cases");
  redirect(`/test-cases/${clone.id}/edit`);
}

export async function importTestCases(rows) {
  const supabase = await createClient();
  const invalidRows = rows.filter((row) => validateRow(row).length > 0);

  if (invalidRows.length > 0) {
    throw new Error(
      `Cannot import: ${invalidRows.length} row(s) still have missing required fields.`,
    );
  }

  const rowsToInsert = rows.map((row) => {
    const base = {
      title: row.title,
      preconditions: row.preconditions || null,
      steps_to_reproduce: row.steps_to_reproduce,
      expected_result: row.expected_result,
    };
    const priority = (row.priority || "").trim().toLowerCase();
    if (VALID_PRIORITIES.includes(priority)) {
      base.priority = priority;
    }
    return base;
  });

  const { data: inserted, error } = await supabase
    .from("test_cases")
    .insert(rowsToInsert)
    .select();
  if (error) throw new Error(error.message);

  const { data: allModules } = await supabase
    .from("modules")
    .select("id, name, archived_at");
  const moduleByName = {};
  allModules.forEach((m) => {
    moduleByName[m.name.toLowerCase()] = m;
  });

  const nextPositionByModule = {};
  const unmatchedNames = new Set();
  const archivedNames = new Set();
  const moduleLinksToInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const moduleNames = (rows[i].modules || "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    for (const name of moduleNames) {
      const mod = moduleByName[name.toLowerCase()];

      if (!mod) {
        unmatchedNames.add(name);
        continue;
      }

      if (mod.archived_at) {
        archivedNames.add(name);
        continue;
      }

      moduleLinksToInsert.push({
        module_id: mod.id,
        test_case_id: inserted[i].id,
        position: nextPositionByModule[mod.id],
      });
      nextPositionByModule[mod.id]++;
    }
  }

  if (moduleLinksToInsert.length > 0) {
    const { error: linkError } = await supabase
      .from("module_cases")
      .insert(moduleLinksToInsert);
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/test-cases");
  return {
    importedCount: inserted.length,
    unmatchedModuleNames: Array.from(unmatchedNames),
    archivedModuleNames: Array.from(archivedNames),
  };
}

export async function exportTestCases(scope) {
  const supabase = await createClient();

  let suiteId = null;
  let moduleId = null;

  if (scope && scope !== "all") {
    const [type, id] = scope.split(":");
    const parsedId = parseIdParam(id);
    if (!parsedId || (type !== "suite" && type !== "module")) {
      return {
        error:
          "That export selection is not valid. Reload the page and try again.",
      };
    }
    if (type === "suite") suiteId = parsedId;
    else moduleId = parsedId;
  }

  const rows = [];
  let complete = false;

  for (let page = 0; page < EXPORT_MAX_PAGES; page++) {
    const { data, error } = await supabase
      .rpc("export_test_cases", { p_suite_id: suiteId, p_module_id: moduleId })
      .order("seq_number", { ascending: true })
      .order("id", { ascending: true })
      .range(rows.length, rows.length + EXPORT_PAGE_SIZE - 1);

    if (error) return { error: error.message };

    if (!data || data.length === 0) {
      complete = true;
      break;
    }
    rows.push(...data);
  }

  if (!complete) {
    return {
      error:
        "This export is too large to download in one file. Export a suite or module at a time.",
    };
  }

  return {
    rows: rows.map((tc) => ({
      title: tc.title,
      preconditions: tc.preconditions,
      steps_to_reproduce: tc.steps_to_reproduce,
      expected_result: tc.expected_result,
      priority: tc.priority,
      modules: (tc.module_names || []).join(", "),
    })),
  };
}
