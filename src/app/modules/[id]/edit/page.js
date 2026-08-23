import { supabase } from "@/lib/supabaseClient";
import { updateModule } from "../../actions";
import Button from "@/components/Button";

export default async function EditModule({ params }) {
  const { id } = await params;

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="mb-6">Edit Module</h1>
      <form action={updateModule} className="space-y-4">
        <input type="hidden" name="moduleId" value={mod.id} />
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            defaultValue={mod.name}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={mod.description}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </main>
  );
}
