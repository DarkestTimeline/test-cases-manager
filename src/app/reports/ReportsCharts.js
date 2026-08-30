"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportsCharts({ data }) {
  if (data.length === 0) {
    return (
      <p className="text-slate-500">
        Not enough run history yet to show trends.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-2">Pass Rate Over Time</h2>
        <p className="text-sm text-slate-500 mb-4">
          Percentage of completed runs marked Pass, by week.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value) => (value === null ? "No data" : `${value}%`)}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="#0d9488"
              strokeWidth={2}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="mb-2">Run Activity</h2>
        <p className="text-sm text-slate-500 mb-4">
          Number of runs started per week.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="volume" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
