"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cleanText } from "@/lib/nameValidation";

export async function signup(prevState, formData) {
  const displayName = cleanText(formData.get("displayName"));
  const email = cleanText(formData.get("email"));
  const password = formData.get("password");
  const inviteCode = cleanText(formData.get("inviteCode"));

  if (!displayName) {
    return { error: "Enter your name.", displayName, email };
  }

  // Fails closed: if INVITE_CODE is missing or empty, nobody gets in.
  const expectedCode = process.env.INVITE_CODE;
  if (!expectedCode || inviteCode !== expectedCode) {
    return { error: "Invalid invite code.", displayName, email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message, displayName, email };
  }

  if (data.user) {
    // The account already exists at this point, so a failure here shouldn't block sign-in.
    // The name can be changed on the Profile page.
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", data.user.id);
  }

  redirect("/");
}
