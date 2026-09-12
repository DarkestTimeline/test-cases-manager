import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { toggleUserRole, toggleUserActive } from "../actions";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { formatStatusLabel } from "@/lib/formatLabel";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    redirect("/");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name");

  return (
    <main className="p-8 w-full max-w-3xl mx-auto">
      <h1 className="mb-6">Manage Users</h1>
      <ul className="space-y-3">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{profile.display_name}</p>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-primary-light text-primary">
                  {formatStatusLabel(profile.role)}
                </Badge>
                <Badge
                  className={
                    profile.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }
                >
                  {profile.is_active ? "Active" : "Deactivated"}
                </Badge>
              </div>
            </div>
            {profile.id !== user.id && (
              <div className="flex gap-2">
                <form action={toggleUserRole}>
                  <input type="hidden" name="userId" value={profile.id} />
                  <input
                    type="hidden"
                    name="newRole"
                    value={profile.role === "admin" ? "user" : "admin"}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {profile.role === "admin"
                      ? "Demote to User"
                      : "Promote to Admin"}
                  </Button>
                </form>
                <form action={toggleUserActive}>
                  <input type="hidden" name="userId" value={profile.id} />
                  <input
                    type="hidden"
                    name="newActive"
                    value={(!profile.is_active).toString()}
                  />
                  <Button
                    type="submit"
                    variant={profile.is_active ? "danger" : "success"}
                    size="sm"
                  >
                    {profile.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
