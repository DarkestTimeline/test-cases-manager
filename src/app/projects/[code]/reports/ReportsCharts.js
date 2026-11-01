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

function formatWeek(week) {
  return new Date(`${week}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function WeekTick({ x, y, payload, dataByWeek }) {
  const count = dataByWeek[payload.value]?.decided ?? 0;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fontSize={12}
        fill="#334155"
      >
        {formatWeek(payload.value)}
      </text>
      <text
        x={0}
        y={0}
        dy={28}
        textAnchor="middle"
        fontSize={11}
        fill="#94a3b8"
      >
        {count} run{count === 1 ? "" : "s"}
      </text>
    </g>
  );
}

export default function ReportsCharts({ data }) {
  if (data.length === 0) {
    return (
      <p className="text-slate-500">
        Not enough run history yet to show trends.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    displayPassRate: getBarDisplayWidth(d.passRate),
  }));
  const dataByWeek = Object.fromEntries(chartData.map((d) => [d.week, d]));

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-2">Pass Rate Over Time</h2>
        <p className="text-sm text-slate-500 mb-4">
          Percentage of completed runs marked Pass, by week. The number under
          each week is how many completed runs the bar is based on.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              height={45}
              tick={<WeekTick dataByWeek={dataByWeek} />}
            />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              labelFormatter={(week) => `Week of ${formatWeek(week)}`}
              formatter={(value, name, props) => {
                const p = props.payload;
                if (p.passRate === null) return "No completed runs";
                return `${p.passRate}% (${p.decided} run${p.decided === 1 ? "" : "s"})`;
              }}
            />
            <Bar
              dataKey="displayPassRate"
              name="Pass Rate"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((d) => (
                <Cell key={d.week} fill={getPassRateColor(d.passRate)} />
              ))}
            </Bar>
          </BarChart>
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
            <XAxis
              dataKey="week"
              tickFormatter={formatWeek}
              tick={{ fontSize: 12 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip labelFormatter={(week) => `Week of ${formatWeek(week)}`} />
            <Bar
              dataKey="volume"
              name="Runs Started"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
