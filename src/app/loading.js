import Card from "@/components/Card";
import { Bone, SkeletonPage } from "@/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage width="wide">
      <div className="mb-8">
        <Bone className="h-8 w-56 mb-1" />
        <Bone className="h-6 w-72" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Bone className="h-9 w-14 mx-auto" />
            <Bone className="h-5 w-28 mx-auto mt-1" />
          </Card>
        ))}
      </div>

      <Bone className="h-7 w-40 mb-3" />
      <ul className="space-y-2 mb-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <li key={i}>
            <Card className="flex justify-between items-center">
              <div className="flex-1">
                <Bone className="h-6 w-1/3" />
                <Bone className="h-5 w-1/4 mt-1" />
              </div>
              <Bone className="h-6 w-20" radius="full" />
            </Card>
          </li>
        ))}
      </ul>

      <Bone className="h-7 w-36 mb-3" />
      <ul className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <Card className="flex justify-between items-center">
              <Bone className="h-6 w-1/3" />
              <Bone className="h-6 w-28" radius="full" />
            </Card>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}
