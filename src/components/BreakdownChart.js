"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function BreakdownChart({
  items,
  itemLabel = "Item",
  countLabel = "Total",
}) {
  if (items.length === 0) {
    return <p className="text-slate-500">No data yet.</p>;
  }

  const chartHeight = Math.max(150, items.length * 50);

  function colorFor(passRate) {
    if (passRate === null) return "#cbd5e1";
    if (passRate >= 80) return "#059669";
    if (passRate >= 50) return "#d97706";
    return "#dc2626";
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={items} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => (value === null ? "No data" : `${value}%`)}
          />
          <Bar dataKey="passRate" name="Pass Rate" radius={[0, 4, 4, 0]}>
            {items.map((item) => (
              <Cell key={item.id} fill={colorFor(item.passRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <table className="w-full text-sm mt-6 border rounded overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-2">{itemLabel}</th>
            <th className="text-right p-2">{countLabel}</th>
            <th className="text-right p-2">Pass</th>
            <th className="text-right p-2">Fail</th>
            <th className="text-right p-2">Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.name}</td>
              <td className="p-2 text-right">{item.total}</td>
              <td className="p-2 text-right">{item.pass}</td>
              <td className="p-2 text-right">{item.fail}</td>
              <td className="p-2 text-right">
                {item.passRate === null ? "—" : `${item.passRate}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
