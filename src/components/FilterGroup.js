export default function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}
