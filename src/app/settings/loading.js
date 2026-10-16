import { Bone } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-4 motion-safe:animate-pulse">
      <span className="sr-only">Loading…</span>
      <Bone className="h-7 w-56" />
      <div className="space-y-2">
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-4/5" />
      </div>
      <Bone className="h-6 w-44" />
      <Bone className="h-9 w-72 max-w-full" />
    </div>
  );
}
