"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    throw new Error("Only admins can do this.");
  }

  return user;
}

export async function toggleUserRole(formData) {
  const supabase = await createClient();
  const userId = formData.get("userId");
  const newRole = formData.get("newRole");

  const user = await requireAdmin(supabase);
  if (userId === user.id) throw new Error("You cannot change your own role.");

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function toggleUserActive(formData) {
  const supabase = await createClient();
  const userId = formData.get("userId");
  const newActive = formData.get("newActive") === "true";

  const user = await requireAdmin(supabase);
  if (userId === user.id) throw new Error("You cannot deactivate yourself.");

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: newActive })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
