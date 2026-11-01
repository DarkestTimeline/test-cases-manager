import { FormPageSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <FormPageSkeleton
      showBackLink={false}
      showModules
      fieldHeights={["h-10", "h-14", "h-24", "h-14", "h-10"]}
    />
  );
}
