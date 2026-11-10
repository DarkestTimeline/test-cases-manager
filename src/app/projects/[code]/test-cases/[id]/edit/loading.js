import { FormPageSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <FormPageSkeleton
      showModules
      width="wide"
      fieldHeights={["h-10", "h-14", "h-48", "h-10"]}
    />
  );
}
