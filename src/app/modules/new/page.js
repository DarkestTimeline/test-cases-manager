import { createModule } from "../actions";
import Button from "@/components/Button";

export default function NewModule() {
  return (
    <main className="p-8 w-full max-w-2xl mx-auto">
      <h1 className="mb-6">New Module</h1>
      <form action={createModule} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>
        <Button type="submit">Create Module</Button>
      </form>
    </main>
  );
}
