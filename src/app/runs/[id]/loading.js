export default function Loading() {
  return (
    <main className="p-8 w-full max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-40 bg-slate-100 rounded mb-6" />
      <div className="space-y-4">
        <div className="h-24 bg-slate-100 rounded" />
        <div className="h-24 bg-slate-100 rounded" />
      </div>
    </main>
  )
}