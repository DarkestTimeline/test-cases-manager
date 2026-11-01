import Card from "@/components/Card";
import { Bone, SkeletonPage } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage width="wide">
      <Bone className="h-8 w-48 mb-4" />
      <Bone className="h-10 w-80 max-w-full mb-4" radius="lg" />
      <Bone className="h-5 w-28 mb-8" />

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <Card>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Bone className="h-6 w-48" />
                  <Bone className="h-5 w-32" />
                  <Bone className="h-4 w-56" />
                </div>
                <div className="flex gap-1">
                  <Bone className="h-6 w-20" radius="full" />
                  <Bone className="h-6 w-14" radius="full" />
                </div>
              </div>
              <Bone className="h-3 w-full mt-3" radius="full" />
              <div className="flex gap-2 mt-2">
                <Bone className="h-6 w-16" radius="full" />
                <Bone className="h-6 w-14" radius="full" />
                <Bone className="h-6 w-20" radius="full" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
