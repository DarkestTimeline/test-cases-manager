"use client";

import { useLinkStatus } from "next/link";

export default function LinkPending({ children }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={pending ? "opacity-60 motion-safe:animate-pulse" : undefined}
    >
      {children}
    </span>
  );
}
