import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { formatId } from "@/lib/displayId";
import { archiveModule, restoreModule } from "./actions";

export default async function ModulesList({ searchParams }) {
  const { archived } = await searchParams;
  const showingArchived = archived === "true";

  let query = supabase
    .from("modules")
    .select("*")
    .order("created_at", { ascending: false });

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  const { data: modules, error } = await query;

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modules</h1>
        <div className="flex gap-2">
          <Link
            href={showingArchived ? "/modules" : "/modules?archived=true"}
            className="text-sm px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {showingArchived ? "View Active" : "View Archived"}
          </Link>
          <Link
            href="/modules/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Module
          </Link>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="text-gray-500">
          {showingArchived ? "No archived modules." : "No modules yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {modules.map((mod) => (
            <li
              key={mod.id}
              className="border rounded p-4 flex justify-between items-start gap-3"
            >
              <div>
                <Link
                  href={`/modules/${mod.id}`}
                  className="font-semibold hover:underline"
                >
                  {mod.seq_number && (
                    <span className="text-gray-400 font-normal mr-2">
                      {formatId("M", mod.seq_number)}
                    </span>
                  )}
                  {mod.name}
                </Link>
                <p className="text-sm text-gray-600 mt-1">{mod.description}</p>
              </div>
              <form action={showingArchived ? restoreModule : archiveModule}>
                <input type="hidden" name="moduleId" value={mod.id} />
                <button
                  type="submit"
                  className={`text-xs px-3 py-1 rounded whitespace-nowrap ${
                    showingArchived
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {showingArchived ? "Restore" : "Archive"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
