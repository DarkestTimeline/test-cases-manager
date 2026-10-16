import Card from "@/components/Card";
import { Bone, SkeletonPage } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage width="medium">
      <Bone className="h-8 w-32 mb-6" />
      <div className="space-y-8">
        <Card>
          <div className="flex justify-between items-center mb-3">
            <Bone className="h-5 w-28" />
            <Bone className="h-6 w-14" radius="full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Bone className="h-4 w-20" />
                <Bone className="h-4 w-32" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Bone className="h-5 w-28" />
          <Bone className="h-10 w-full" />
          <Bone className="h-6 w-24" />
        </div>

        <div className="space-y-3">
          <Bone className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Bone className="h-5 w-32 mb-1" />
              <Bone className="h-10 w-full" />
            </div>
          ))}
          <Bone className="h-6 w-32" />
        </div>
      </div>
    </SkeletonPage>
  );
}
