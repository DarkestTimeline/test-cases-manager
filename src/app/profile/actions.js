"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDisplayName(prevState, formData) {
  const supabase = await createClient();
  const displayName = formData.get("displayName");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  return { error: null, success: "Display name updated." };
}

export async function updatePassword(prevState, formData) {
  const supabase = await createClient();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match.", success: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { error: "Current password is incorrect.", success: null };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message, success: null };
  }

  return { error: null, success: "Password updated." };
}
