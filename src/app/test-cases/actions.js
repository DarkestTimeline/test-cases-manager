"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseIdParam } from "@/lib/params";
import {
  MAX_IMPORT_ROWS,
  DEFAULT_PRIORITY,
  PRIORITIES,
  readTestCaseForm,
  validateRow,
  validateTestCase,
} from "@/lib/testCaseValidation";

const EXPORT_PAGE_SIZE = 1000;
const EXPORT_MAX_PAGES = 200;
const FIX_FIELDS_MESSAGE = "Fix the highlighted fields and try again.";

function formFailure(prevState, values, { error, fieldErrors = {} }) {
  return { error, fieldErrors, values, attempt: (prevState?.attempt ?? 0) + 1 };
}

// Links a test case to active modules, appending it at the end of each one's order.
async function linkToModules(supabase, testCaseId, moduleIds) {
  if (moduleIds.length === 0) return null;

  const { data: modules, error } = await supabase
    .from("modules")
    .select("id, module_cases(position)")
    .in("id", moduleIds)
    .is("archived_at", null);
  if (error) return error;

  const rows = (modules || []).map((m) => ({
    module_id: m.id,
    test_case_id: testCaseId,
    position:
      Math.max(-1, ...m.module_cases.map((mc) => mc.position ?? -1)) + 1,
  }));
  if (rows.length === 0) return null;

  const { error: insertError } = await supabase
    .from("module_cases")
    .insert(rows);
  return insertError;
}

export async function createTestCase(prevState, formData) {
  const values = readTestCaseForm(formData);
  const fieldErrors = validateTestCase(values);
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: testCase, error } = await supabase
    .from("test_cases")
    .insert({
      title: values.title,
      preconditions: values.preconditions || null,
      steps_to_reproduce: values.steps_to_reproduce,
      expected_result: values.expected_result,
      priority: values.priority,
    })
    .select("id")
    .single();

  if (error) {
    return formFailure(prevState, values, {
      error: `Could not create the test case: ${error.message}`,
    });
  }

  const linkError = await linkToModules(
    supabase,
    testCase.id,
    values.moduleIds,
  );

  revalidatePath("/test-cases");
  if (linkError) {
    // The test case exists, so don't leave the person on a form they could resubmit.
    redirect(`/test-cases/${testCase.id}/edit?notice=modules-failed`);
  }
  redirect("/test-cases");
}

export async function updateTestCase(prevState, formData) {
  const values = readTestCaseForm(formData);
  const testCaseId = parseIdParam(formData.get("testCaseId"));
  if (!testCaseId) {
    return formFailure(prevState, values, {
      error:
        "This test case could not be identified. Reload the page and try again.",
    });
  }

  const fieldErrors = validateTestCase(values);
  if (Object.keys(fieldErrors).length > 0) {
    return formFailure(prevState, values, {
      error: FIX_FIELDS_MESSAGE,
      fieldErrors,
    });
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("test_cases")
    .update({
      title: values.title,
      preconditions: values.preconditions || null,
      steps_to_reproduce: values.steps_to_reproduce,
      expected_result: values.expected_result,
      priority: values.priority,
    })
    .eq("id", testCaseId)
    .select("id");

  if (error) {
    return formFailure(prevState, values, {
      error: `Could not save changes: ${error.message}`,
    });
  }
  if (!updated || updated.length === 0) {
    return formFailure(prevState, values, {
      error: "This test case no longer exists.",
    });
  }

  const { data: existingLinks, error: linksError } = await supabase
    .from("module_cases")
    .select("module_id, modules(archived_at)")
    .eq("test_case_id", testCaseId);
  if (linksError) {
    return formFailure(prevState, values, {
      error: `Your changes were saved, but the modules could not be read: ${linksError.message}`,
    });
  }

  // Only active modules are shown in the form, so only those are managed here.
  const currentActive = new Set(
    (existingLinks || [])
      .filter((l) => !l.modules?.archived_at)
      .map((l) => l.module_id),
  );
  const wanted = new Set(values.moduleIds);
  const toRemove = [...currentActive].filter((id) => !wanted.has(id));
  const toAdd = values.moduleIds.filter((id) => !currentActive.has(id));

  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from("module_cases")
      .delete()
      .eq("test_case_id", testCaseId)
      .in("module_id", toRemove);
    if (removeError) {
      return formFailure(prevState, values, {
        error: `Your changes were saved, but the modules could not be updated: ${removeError.message}`,
      });
    }
  }

  const linkError = await linkToModules(supabase, testCaseId, toAdd);
  if (linkError) {
    return formFailure(prevState, values, {
      error: `Your changes were saved, but the modules could not be updated: ${linkError.message}`,
    });
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
  const testCaseId = parseIdParam(formData.get("testCaseId"));
  if (!testCaseId) throw new Error("Invalid test case.");

  const { data: source, error: sourceError } = await supabase
    .from("test_cases")
    .select("*")
    .eq("id", testCaseId)
    .single();
  if (sourceError || !source)
    throw new Error("That test case could not be found.");

  const { data: clone, error } = await supabase
    .from("test_cases")
    .insert({
      title: `${source.title} (Copy)`,
      preconditions: source.preconditions,
      steps_to_reproduce: source.steps_to_reproduce,
      expected_result: source.expected_result,
      priority: source.priority,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: links, error: linksError } = await supabase
    .from("module_cases")
    .select("module_id")
    .eq("test_case_id", testCaseId);
  if (linksError) throw new Error(linksError.message);

  const linkError = await linkToModules(
    supabase,
    clone.id,
    (links || []).map((l) => l.module_id),
  );
  if (linkError) throw new Error(linkError.message);

  revalidatePath("/test-cases");
  redirect(`/test-cases/${clone.id}/edit`);
}

export async function importTestCases(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "There are no rows to import." };
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      error: `This file has ${rows.length} rows. Import at most ${MAX_IMPORT_ROWS} at a time by splitting the file. Nothing was imported.`,
    };
  }

  const invalidCount = rows.filter((row) => validateRow(row).length > 0).length;
  if (invalidCount > 0) {
    return {
      error: `${invalidCount} row${invalidCount === 1 ? " is" : "s are"} missing required fields. Nothing was imported.`,
    };
  }

  const supabase = await createClient();

  // Read-only planning comes first, so a failure here leaves nothing half-imported.
  const { data: allModules, error: modulesError } = await supabase
    .from("modules")
    .select("id, name, archived_at, module_cases(position)");
  if (modulesError) {
    return {
      error: `Could not read the modules (${modulesError.message}). Nothing was imported.`,
    };
  }

  const moduleByName = new Map();
  (allModules || []).forEach((m) => {
    const key = m.name.toLowerCase();
    const current = moduleByName.get(key);
    if (!current || (current.archived_at && !m.archived_at))
      moduleByName.set(key, m);
  });

  const unmatched = new Set();
  const archived = new Set();
  const plannedLinks = [];

  rows.forEach((row, rowIndex) => {
    const seen = new Set();
    String(row.modules ?? "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .forEach((name) => {
        const mod = moduleByName.get(name.toLowerCase());
        if (!mod) {
          unmatched.add(name);
          return;
        }
        if (mod.archived_at) {
          archived.add(name);
          return;
        }
        if (seen.has(mod.id)) return;
        seen.add(mod.id);
        plannedLinks.push({ rowIndex, moduleId: mod.id });
      });
  });

  const nextPosition = new Map();
  (allModules || []).forEach((m) => {
    nextPosition.set(
      m.id,
      Math.max(-1, ...(m.module_cases || []).map((mc) => mc.position ?? -1)) +
        1,
    );
  });

  const rowsToInsert = rows.map((row) => {
    const priority = String(row.priority ?? "")
      .trim()
      .toLowerCase();
    return {
      title: String(row.title).trim(),
      preconditions: String(row.preconditions ?? "").trim() || null,
      steps_to_reproduce: String(row.steps_to_reproduce).trim(),
      expected_result: String(row.expected_result).trim(),
      priority: PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY,
    };
  });

  // One statement, so it either all lands or none of it does.
  const { data: inserted, error } = await supabase
    .from("test_cases")
    .insert(rowsToInsert)
    .select("id, seq_number");
  if (error) {
    return {
      error: `The import failed: ${error.message}. Nothing was imported.`,
    };
  }

  const result = {
    importedCount: inserted.length,
    unmatchedModuleNames: [...unmatched],
    archivedModuleNames: [...archived],
    linkError: null,
  };

  // Identity numbers are handed out in input order, so sorting by them restores row order.
  const insertedInOrder = [...inserted].sort(
    (a, b) => a.seq_number - b.seq_number,
  );

  if (insertedInOrder.length !== rows.length) {
    result.linkError =
      "the imported test cases could not be matched to their rows";
  } else if (plannedLinks.length > 0) {
    const linkRows = plannedLinks.map(({ rowIndex, moduleId }) => {
      const position = nextPosition.get(moduleId);
      nextPosition.set(moduleId, position + 1);
      return {
        module_id: moduleId,
        test_case_id: insertedInOrder[rowIndex].id,
        position,
      };
    });
    const { error: linkError } = await supabase
      .from("module_cases")
      .insert(linkRows);
    if (linkError) result.linkError = linkError.message;
  }

  revalidatePath("/test-cases");
  return result;
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
