'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface DayCount {
  date: string;
  count: number;
}

interface CategoryCount {
  name: string;
  count: number;
}

interface OverviewChartsProps {
  userSignups: DayCount[];
  businessCreations: DayCount[];
  byCategory: CategoryCount[];
}

const PIE_COLORS = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#f97316', '#ec4899', '#14b8a6', '#84cc16',
];

export function OverviewCharts({
  userSignups,
  businessCreations,
  byCategory,
}: OverviewChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      <Card className="border-neutral-200">
        <CardHeader className="pb-2 px-5 pt-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            User Signups — Last 30 Days
          </h2>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userSignups} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                cursor={{ fill: '#f5f5f5' }}
              />
              <Bar dataKey="count" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Signups" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader className="pb-2 px-5 pt-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            Business Listings — Last 30 Days
          </h2>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={businessCreations} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                cursor={{ fill: '#f5f5f5' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Listings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 xl:col-span-2">
        <CardHeader className="pb-2 px-5 pt-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            Businesses by Trade Category
          </h2>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {byCategory.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
