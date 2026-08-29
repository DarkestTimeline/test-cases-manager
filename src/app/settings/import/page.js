import { supabase } from "@/lib/supabaseClient";
import ImportTestCases from "./ImportTestCases";

export default async function ImportPage() {
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name")
    .is("archived_at", null)
    .order("name");

  return <ImportTestCases modules={modules || []} />;
}
