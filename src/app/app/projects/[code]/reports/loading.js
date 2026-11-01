import { Bone, SkeletonPage } from "@/components/Skeleton";
import { ReportsFilterSkeleton, ReportsDataSkeleton } from "./ReportsSkeleton";

export default function Loading() {
  return (
    <SkeletonPage width="reports">
      <Bone className="h-8 w-32 mb-4" />
      <ReportsFilterSkeleton />
      <ReportsDataSkeleton />
    </SkeletonPage>
  );
}
