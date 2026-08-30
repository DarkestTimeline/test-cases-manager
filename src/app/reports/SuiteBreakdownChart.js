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

export default function SuiteBreakdownChart({ suites }) {
  if (suites.length === 0) {
    return <p className="text-slate-500">No suite run history yet.</p>;
  }

  const chartHeight = Math.max(150, suites.length * 50);

  function colorFor(passRate) {
    if (passRate === null) return "#cbd5e1";
    if (passRate >= 80) return "#059669";
    if (passRate >= 50) return "#d97706";
    return "#dc2626";
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={suites} layout="vertical" margin={{ left: 40 }}>
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
          <Bar dataKey="passRate" radius={[0, 4, 4, 0]}>
            {suites.map((s) => (
              <Cell key={s.suiteId} fill={colorFor(s.passRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <table className="w-full text-sm mt-6 border rounded overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-2">Suite</th>
            <th className="text-right p-2">Runs</th>
            <th className="text-right p-2">Pass</th>
            <th className="text-right p-2">Fail</th>
            <th className="text-right p-2">Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {suites.map((s) => (
            <tr key={s.suiteId} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2 text-right">{s.total}</td>
              <td className="p-2 text-right">{s.pass}</td>
              <td className="p-2 text-right">{s.fail}</td>
              <td className="p-2 text-right">
                {s.passRate === null ? "—" : `${s.passRate}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
