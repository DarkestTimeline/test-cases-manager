"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signup(formData) {
  const displayName = formData.get("displayName");
  const email = formData.get("email");
  const password = formData.get("password");
  const inviteCode = formData.get("inviteCode");

  if (inviteCode !== process.env.INVITE_CODE) {
    redirect(`/signup?error=${encodeURIComponent("Invalid invite code.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data.user.id);
  }

  redirect("/");
}
