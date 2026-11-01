import Link from "next/link";
import Card from "./Card";

// Pass `href` to make the whole card a link (used for overview shortcuts).
export default function StatCard({
  label,
  value,
  sublabel,
  valueColor,
  href,
}) {
  const card = (
    <Card
      className={`text-center${
        href ? " transition-colors hover:border-primary" : ""
      }`}
    >
      <p
        className="text-3xl font-bold text-primary"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      <p className="text-sm text-slate-700 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block rounded-lg">
      {card}
    </Link>
  );
}
