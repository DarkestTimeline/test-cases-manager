import { Bone, SkeletonPage } from "@/components/Skeleton";

function ResultCardSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start gap-3">
        <Bone className="h-6 w-3/5" />
        <Bone className="h-6 w-14" radius="full" />
      </div>
      <div className="mt-3 space-y-2">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
      </div>
      <div className="mt-3 flex gap-2">
        <Bone className="h-6 w-14" />
        <Bone className="h-6 w-14" />
        <Bone className="h-6 w-16" />
        <Bone className="h-6 w-16" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <SkeletonPage width="standard">
      <Bone className="h-4 w-36 mb-4" />

      <div className="mb-6 space-y-2">
        <Bone className="h-8 w-72" />
        <Bone className="h-5 w-40" />
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-36" />
        <Bone className="h-4 w-72" />
        <Bone className="h-6 w-64" />
        <Bone className="h-3 w-full" radius="full" />
      </div>

      <div className="space-y-6">
        <Bone className="h-4 w-80 max-w-full" />
        {[0, 1].map((section) => (
          <div key={section}>
            <div className="flex justify-between items-center mb-2 border-b pb-1">
              <Bone className="h-7 w-48" />
              <Bone className="h-6 w-32" />
            </div>
            <div className="space-y-4">
              <ResultCardSkeleton />
              <ResultCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
