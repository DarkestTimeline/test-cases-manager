"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateDisplayName(formData) {
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
    redirect(`/settings/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/settings/profile?success=Display name updated.");
}

export async function updatePassword(formData) {
  const supabase = await createClient();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (newPassword !== confirmPassword) {
    redirect(
      `/settings/profile?error=${encodeURIComponent("New passwords do not match.")}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    redirect(
      `/settings/profile?error=${encodeURIComponent("Current password is incorrect.")}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    redirect(`/settings/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/settings/profile?success=Password updated.");
}
