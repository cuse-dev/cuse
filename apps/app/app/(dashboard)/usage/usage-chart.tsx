'use client';

import { Card } from '@repo/design-system/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import type { TimeRange, UsageTimeSeries } from '@repo/services/usage';
import { format } from 'date-fns';
import { Activity, Monitor } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface UsageChartProps {
  data: UsageTimeSeries | null;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const chartConfig = {
  actions: {
    label: 'Actions',
    color: 'hsl(var(--primary))',
    icon: Activity,
  },
  computers: {
    label: 'Computers',
    color: 'hsl(var(--chart-1))',
    icon: Monitor,
  },
} as const;

export function UsageChart({
  data,
  timeRange,
  onTimeRangeChange,
}: UsageChartProps) {
  const timeRangeOptions = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 3 months',
  } as const;

  return (
    <Card className="flex h-full flex-col space-y-4 bg-muted/50">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h3 className="font-semibold text-lg">Usage History</h3>
          <p className="text-muted-foreground text-sm">
            Daily action count and active computers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={timeRangeOptions[timeRange]} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeRangeOptions).map(([value, label]) => (
                <SelectItem key={value} value={value as TimeRange}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-full p-2">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.data ?? []}>
              <defs>
                {Object.entries(chartConfig).map(([key, config]) => (
                  <linearGradient
                    key={key}
                    id={`color${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={config.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={config.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) =>
                  format(new Date(value), 'MMM d')
                }
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="mb-2">
                          <span className="font-medium">
                            {format(new Date(label ?? ''), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="grid gap-1">
                          {payload.map((entry) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-[0.70rem] text-muted-foreground uppercase">
                                {
                                  chartConfig[
                                    entry.name as keyof typeof chartConfig
                                  ].label
                                }
                              </span>
                              <span className="font-medium">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                content={({ payload }) => (
                  <div className="flex justify-center gap-4 pt-4">
                    {payload?.map((entry) => (
                      <div
                        key={entry.value}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              chartConfig[
                                entry.value as keyof typeof chartConfig
                              ].color,
                          }}
                        />
                        <span className="text-sm">
                          {
                            chartConfig[entry.value as keyof typeof chartConfig]
                              .label
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {Object.keys(chartConfig).map((key) => (
                <Area
                  type="step"
                  key={key}
                  dataKey={key}
                  stroke={chartConfig[key as keyof typeof chartConfig].color}
                  fill={`url(#color${key})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
