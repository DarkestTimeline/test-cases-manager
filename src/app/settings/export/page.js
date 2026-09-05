import { createClient } from '@/lib/supabase/server'
import ExportTestCases from "./ExportTestCases";

export default async function ExportPage() {
  const supabase = await createClient();
  const { data: suites } = await supabase
    .from("suites")
    .select("id, name")
    .is("archived_at", null)
    .order("name");
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .is("archived_at", null)
    .order("name");

  return <ExportTestCases suites={suites || []} modules={modules || []} />;
}
