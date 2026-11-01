import Card from "@/components/Card";
import { Bone } from "@/components/Skeleton";

export function ReportsFilterSkeleton() {
  return (
    <>
      <Card className="space-y-5">
        <div>
          <Bone className="h-4 w-24 mb-2" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Bone className="h-10 w-56" radius="lg" />
            <Bone className="h-9 w-full sm:w-72" />
          </div>
        </div>
        <div>
          <Bone className="h-4 w-20 mb-2" />
          <div className="flex flex-col sm:flex-row gap-2">
            <Bone className="h-9 w-full sm:w-44" />
            <Bone className="h-9 w-full sm:w-44" />
            <Bone className="h-9 w-full sm:w-20" />
          </div>
        </div>
      </Card>
      <div className="mt-3 mb-8 space-y-1">
        <Bone className="h-5 w-80 max-w-full" />
        <Bone className="h-4 w-full" />
      </div>
    </>
  );
}

function SectionSkeleton({ chart, table, className = "mt-10" }) {
  return (
    <div className={className}>
      <Bone className="h-7 w-48 mb-2" />
      <Bone className="h-5 w-full max-w-xl mb-4" />
      {chart && <Bone className={`w-full ${chart}`} radius="lg" />}
      {table && <Bone className={`w-full mt-6 ${table}`} />}
    </div>
  );
}

export function ReportsDataSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Bone className="h-9 w-14 mx-auto" />
            <Bone className="h-5 w-28 mx-auto mt-1" />
            <Bone className="h-4 w-32 mx-auto mt-1" />
          </Card>
        ))}
      </div>
      <SectionSkeleton chart="h-72" className="mt-0" />
      <SectionSkeleton chart="h-64" />
      <SectionSkeleton chart="h-48" table="h-32" />
      <SectionSkeleton chart="h-48" table="h-32" />
      <SectionSkeleton chart="h-40" table="h-24" />
      <SectionSkeleton table="h-40" />
    </div>
  );
}
