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
import { getPassRateColor, getBarDisplayWidth } from "@/lib/reportColors";

function truncate(text, max = 24) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function CountTick({ x, y, payload, itemsById, countLabel }) {
  const item = itemsById[payload.value];
  if (!item) return null;

  const unit = (
    item.total === 1 ? countLabel.replace(/s$/i, "") : countLabel
  ).toLowerCase();

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={-2} textAnchor="end" fontSize={12} fill="#334155">
        {truncate(item.name)}
      </text>
      <text x={-8} y={12} textAnchor="end" fontSize={11} fill="#94a3b8">
        {item.total} {unit}
      </text>
    </g>
  );
}

export default function BreakdownChart({
  items,
  itemLabel = "Item",
  countLabel = "Total",
}) {
  if (items.length === 0) {
    return <p className="text-slate-500">No data yet.</p>;
  }

  const chartHeight = Math.max(150, items.length * 50);

  const chartData = items.map((item) => ({
    ...item,
    displayPassRate: getBarDisplayWidth(item.passRate),
  }));

  const itemsById = Object.fromEntries(
    chartData.map((item) => [item.id, item]),
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="id"
            width={170}
            interval={0}
            tick={<CountTick itemsById={itemsById} countLabel={countLabel} />}
          />
          <Tooltip
            labelFormatter={(id) => itemsById[id]?.name}
            formatter={(value, name, props) => {
              const real = props.payload.passRate;
              return real === null ? "No data" : `${real}%`;
            }}
          />
          <Bar dataKey="displayPassRate" name="Pass Rate" radius={[0, 4, 4, 0]}>
            {chartData.map((item) => (
              <Cell key={item.id} fill={getPassRateColor(item.passRate)} />
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
