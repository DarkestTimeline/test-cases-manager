import Link from "next/link";

export default function SegmentedControl({ options }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-0.5 border">
      {options.map((option) => (
        <Link
          key={option.label}
          href={option.href}
          title={option.title}
          aria-current={option.active ? "true" : undefined}
          className={`px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
            option.active
              ? "bg-white text-primary shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
