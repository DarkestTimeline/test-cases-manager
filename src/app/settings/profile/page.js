import { createClient } from "@/lib/supabase/server";
import { updateDisplayName, updatePassword } from "./actions";
import Button from "@/components/Button";
import Badge from "@/components/Badge";

export default async function ProfilePage({ searchParams }) {
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 max-w-md">
      <h2 className="mb-2">Profile</h2>

      {error && <p className="text-danger text-sm">{error}</p>}
      {success && <p className="text-success text-sm">{success}</p>}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Account Info
        </h3>
        <p className="text-sm text-slate-600">Email: {user.email}</p>
        <Badge className="bg-slate-100 text-slate-700 mt-1">
          {profile.role}
        </Badge>
      </div>

      <form action={updateDisplayName} className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Display Name</h3>
        <input
          type="text"
          name="displayName"
          defaultValue={profile.display_name}
          required
          className="w-full border rounded p-2"
        />
        <Button type="submit" size="sm">
          Save Name
        </Button>
      </form>

      <form action={updatePassword} className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Change Password
        </h3>
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            name="newPassword"
            required
            minLength={6}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={6}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit" size="sm">
          Update Password
        </Button>
      </form>
    </div>
  );
}
