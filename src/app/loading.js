import ListSkeleton from "@/components/ListSkeleton";

export default function Loading() {
  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-56 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg p-4 bg-slate-100 h-20" />
        ))}
      </div>

      <div className="h-6 w-48 bg-slate-200 rounded mb-3 animate-pulse" />
      <ListSkeleton count={3} />
    </main>
  );
}
