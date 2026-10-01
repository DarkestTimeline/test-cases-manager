import Card from "./Card";

export default function StatCard({ label, value, sublabel, valueColor }) {
  return (
    <Card className="text-center">
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
}
