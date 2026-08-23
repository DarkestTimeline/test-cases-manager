import { supabase } from "@/lib/supabaseClient";
import { updateSuite } from "../../actions";
import Button from "@/components/Button";

export default async function EditSuite({ params }) {
  const { id } = await params;

  const { data: suite } = await supabase
    .from("suites")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Suite</h1>
      <form action={updateSuite} className="space-y-4">
        <input type="hidden" name="suiteId" value={suite.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={suite.name}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={suite.description}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </main>
  );
}
