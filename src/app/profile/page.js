import { createClient } from "@/lib/supabase/server";
import { updateDisplayName, updatePassword } from "./actions";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { formatStatusLabel } from "@/lib/formatLabel";

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
  const { count: runsStarted } = await supabase
    .from("test_runs")
    .select("*", { count: "exact", head: true })
    .eq("started_by", user.id);

  return (
    <main className="p-8 w-full max-w-md mx-auto">
      <h1 className="mb-6">Profile</h1>
      <div className="space-y-8">
        {error && <p className="text-danger text-sm">{error}</p>}
        {success && <p className="text-success text-sm">{success}</p>}

        <Card>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Account Info
            </h3>
            <Badge className="bg-primary-light text-primary">
              {formatStatusLabel(profile.role)}
            </Badge>
          </div>
          <dl className="text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-700">{profile.display_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-700">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Member Since</dt>
              <dd className="text-slate-700">
                {new Date(profile.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Runs Started</dt>
              <dd className="text-slate-700">{runsStarted || 0}</dd>
            </div>
          </dl>
        </Card>

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
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
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
    </main>
  );
}
