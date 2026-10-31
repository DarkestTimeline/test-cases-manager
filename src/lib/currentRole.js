// Returns the signed-in user's role ("admin" | "user") or null if signed out.
// Pass in an existing Supabase server client.
export async function getCurrentRole(supabase) {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role ?? null;
}
