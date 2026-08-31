export default function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg bg-slate-100 h-20" />
      ))}
    </div>
  )
}