"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function truncate(text, max = 22) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function WorkloadChart({ items }) {
  if (items.length === 0) {
    return <p className="text-slate-500">No data in this time range.</p>;
  }

  const chartHeight = Math.max(150, items.length * 50);
  const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={items}
          layout="vertical"
          margin={{ left: 10, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="id"
            width={150}
            interval={0}
            tick={{ fontSize: 12 }}
            tickFormatter={(id) => truncate(itemsById[id]?.name ?? "")}
          />
          <Tooltip labelFormatter={(id) => itemsById[id]?.name} />
          <Bar
            dataKey="completed"
            name="Completed Runs"
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <table className="w-full text-sm mt-6 border rounded overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-2">Tester</th>
            <th className="text-right p-2">Completed</th>
            <th className="text-right p-2">In Progress</th>
            <th className="text-right p-2">Cancelled</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2">{item.name}</td>
              <td className="p-2 text-right">{item.completed}</td>
              <td className="p-2 text-right">{item.inProgress}</td>
              <td className="p-2 text-right">{item.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
