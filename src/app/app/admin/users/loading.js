import { Bone, SkeletonPage } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage width="medium">
      <Bone className="h-8 w-48 mb-6" />
      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div className="space-y-1">
              <Bone className="h-6 w-36" />
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-40" />
              <div className="flex gap-2 pt-1">
                <Bone className="h-6 w-14" radius="full" />
                <Bone className="h-6 w-16" radius="full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Bone className="h-6 w-32" />
              <Bone className="h-6 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
