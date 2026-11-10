import Card from "./Card";
import AuthShell from "./AuthShell";
import { PAGE } from "@/lib/pageWidths";

const RADIUS = { default: "rounded", lg: "rounded-lg", full: "rounded-full" };

export function Bone({ className = "", radius = "default" }) {
  return <div className={`bg-slate-200 ${RADIUS[radius]} ${className}`} />;
}

export function SkeletonPage({ width = "wide", children }) {
  return (
    <main
      aria-busy="true"
      className={`${PAGE[width]} motion-safe:animate-pulse`}
    >
      <span className="sr-only">Loading…</span>
      {children}
    </main>
  );
}

export function ListPageSkeleton({ rows = 6, hasFilterToggle = false }) {
  return (
    <SkeletonPage width="wide">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <Bone className="h-8 w-40" />
        <div className="flex gap-2">
          <Bone className="h-6 w-28" />
          <Bone className="h-9 w-32" />
        </div>
      </div>

      <div className={`flex gap-2 ${hasFilterToggle ? "mb-2" : "mb-6"}`}>
        <Bone className="h-10 flex-1 max-w-xs" />
        <Bone className="h-9 w-20" />
      </div>

      {hasFilterToggle && <Bone className="h-5 w-28 mb-8" />}

      <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i}>
            <Card className="flex justify-between items-start gap-3">
              <div className="flex-1 space-y-1">
                <Bone className="h-6 w-2/5" />
                <Bone className="h-5 w-3/4" />
              </div>
              <Bone className="h-6 w-16" />
            </Card>
          </li>
        ))}
      </ul>
    </SkeletonPage>
  );
}

export function FormPageSkeleton({
  fieldHeights = [],
  showBackLink = true,
  showModules = false,
  width = "standard",
}) {
  return (
    <SkeletonPage width={width}>
      {showBackLink && <Bone className="h-4 w-28 mb-4" />}
      <Bone className="h-8 w-56 mb-6" />
      <div className="space-y-4">
        <Bone className="h-4 w-16" />
        {fieldHeights.map((height, i) => (
          <div key={i}>
            <Bone className="h-5 w-28 mb-1" />
            <Bone className={`w-full ${height}`} />
          </div>
        ))}
        {showModules && (
          <div>
            <Bone className="h-5 w-20 mb-1" />
            <div className="space-y-1">
              <Bone className="h-10 w-full" />
              <Bone className="h-10 w-full" />
              <Bone className="h-10 w-full" />
            </div>
          </div>
        )}
        <Bone className="h-9 w-36" />
      </div>
    </SkeletonPage>
  );
}

export function DetailPageSkeleton({ linkedRows = 3, pickerGroups = 3 }) {
  return (
    <SkeletonPage width="standard">
      <Bone className="h-4 w-28 mb-4" />

      <div className="flex items-center gap-2 mb-4">
        <Bone className="h-6 w-16" radius="full" />
        <Bone className="h-5 w-10" />
        <Bone className="h-6 w-14" />
      </div>

      <div className="space-y-3 mb-8 border-b pb-6">
        <Bone className="h-4 w-16" />
        <div>
          <Bone className="h-5 w-12 mb-1" />
          <Bone className="h-12 w-full" />
        </div>
        <div>
          <Bone className="h-5 w-24 mb-1" />
          <Bone className="h-14 w-full" />
        </div>
        <Bone className="h-9 w-32" />
      </div>

      <Bone className="h-7 w-56 mb-2" />
      <div className="space-y-2 mb-6">
        {Array.from({ length: linkedRows }).map((_, i) => (
          <Bone key={i} className="h-10 w-full" />
        ))}
      </div>

      <Bone className="h-7 w-40 mb-2" />
      <div className="space-y-2">
        {Array.from({ length: pickerGroups }).map((_, i) => (
          <Bone key={i} className="h-12 w-full" radius="lg" />
        ))}
      </div>
      <Bone className="h-9 w-32 mt-4" />
    </SkeletonPage>
  );
}

export function AuthCardSkeleton({ fields = 2, showDemo = false }) {
  return (
    <AuthShell>
      <div aria-busy="true" className="motion-safe:animate-pulse">
        <span className="sr-only">Loading…</span>
        <Bone className="mb-6 h-6 w-28" />
        <div className="space-y-4">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
              <Bone className="mb-1 h-5 w-16" />
              <Bone className="h-10 w-full" />
            </div>
          ))}
          <Bone className="h-11 w-full" />
        </div>
        {showDemo && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t" />
              <Bone className="h-4 w-4" />
              <div className="flex-1 border-t" />
            </div>
            <Bone className="h-11 w-full" />
          </>
        )}
        <Bone className="mx-auto mt-6 h-5 w-48" />
      </div>
    </AuthShell>
  );
}
