import ListSkeleton from '@/components/ListSkeleton'

export default function Loading() {
  return (
    <main className="p-8 w-full max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="h-10 w-full bg-slate-100 rounded animate-pulse mb-6" />
      <ListSkeleton />
    </main>
  )
}