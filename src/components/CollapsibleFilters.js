"use client";

import { useState } from "react";
import Badge from "./Badge";

export default function CollapsibleFilters({ children, activeCount }) {
  const [isOpen, setIsOpen] = useState(activeCount > 0);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary mb-2"
      >
        <span>{isOpen ? "▲" : "▼"}</span>
        More Filters
        {activeCount > 0 && (
          <Badge className="bg-primary-light text-primary">
            {activeCount} active
          </Badge>
        )}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}
