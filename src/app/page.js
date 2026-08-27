import { supabase } from "@/lib/supabaseClient";
import StartRunButton from "@/components/StartRunButton";
import Button from "@/components/Button";

export default async function Home() {
  const { data: suites } = await supabase
    .from("suites")
    .select("*")
    .is("archived_at", null)
    .order("name");

  return (
    <main className="p-8">
      <h1 className="mb-2">QA Test Manager</h1>
      <p className="text-slate-600 mb-6">
        Manage test cases, build suites, and run them.
      </p>
      <div className="flex gap-3">
        <StartRunButton suites={suites || []} />
        <Button href="/runs" variant="primary">
          Go to Dashboard
        </Button>
      </div>
    </main>
  );
}
