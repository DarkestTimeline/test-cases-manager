import { redirect } from "next/navigation";

export default async function SettingsHome({ params }) {
  const { code } = await params;
  redirect(`/projects/${code}/settings/import`);
}
