import { createClient } from "@/lib/supabase/server";
import ImportTestCases from "./ImportTestCases";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .is("archived_at", null)
    .order("name");

  return <ImportTestCases modules={modules || []} />;
}
