export default function ProgressBar({ counts, total }) {
  if (total === 0) return null;

  const segments = [
    { key: "pass", color: "#059669", count: counts.pass },
    { key: "fail", color: "#dc2626", count: counts.fail },
    { key: "blocked", color: "#d97706", count: counts.blocked },
    { key: "skipped", color: "#9333ea", count: counts.skipped },
    { key: "pending", color: "#cbd5e1", count: counts.pending },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden border">
      {segments.map((s) => (
        <div
          key={s.key}
          style={{
            width: `${(s.count / total) * 100}%`,
            backgroundColor: s.color,
          }}
          title={`${s.count} ${s.key}`}
        />
      ))}
    </div>
  );
}
