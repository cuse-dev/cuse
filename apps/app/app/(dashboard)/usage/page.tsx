'use client';

import { useStore } from '@/app/store/store';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Card } from '@repo/design-system/components/ui/card';
import { useToast } from '@repo/design-system/hooks/use-toast';
import type { TimeRange } from '@repo/services/usage';
import { useEffect, useState } from 'react';
import { Header } from '../components/header';
import { Main } from '../components/main';
import { UsageChart } from './usage-chart';

export default function UsagePage() {
  const { toast } = useToast();
  const {
    usageSummary,
    timeSeriesData,
    fetchUsageSummary,
    fetchTimeSeriesData,
    isLoading,
  } = useStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    fetchUsageSummary();
  }, [fetchUsageSummary]);

  useEffect(() => {
    fetchTimeSeriesData(timeRange);
  }, [fetchTimeSeriesData, timeRange]);

  function handleExportReport() {
    toast({
      title: 'Export started',
      description: 'Generating a usage report. This may take a moment.',
    });
  }

  function handleTimeRangeChange(newRange: TimeRange) {
    setTimeRange(newRange);
  }

  return (
    <div className="flex h-full flex-col space-y-2 pb-2">
      {/* Header and Page Title */}
      <Header pages={[]} page="Usage">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              Usage Dashboard
            </h1>
            <p className="text-muted-foreground">
              View an overview of your actions and compute consumption.
            </p>
          </div>
          <div className="space-x-4">
            <Button
              disabled
              className="cursor-not-allowed"
              onClick={handleExportReport}
            >
              Export Usage
            </Button>
          </div>
        </div>
      </Header>

      {/* Main Body */}
      <Main
        isLoading={isLoading}
        className="max-h-full space-y-4 bg-transparent"
      >
        {/* Usage Summary Card */}
        <Card className="space-y-4 border-none bg-muted/50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="font-medium text-gray-500 text-sm">
                Total Actions
              </h2>
              <p className="font-semibold text-xl">
                {usageSummary?.totalActions ?? 0}
              </p>
            </div>
            <div>
              <h2 className="font-medium text-gray-500 text-sm">
                Computer Instances
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="m-1 text-sm">
                  {usageSummary?.totalInstances ?? 0}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex h-full flex-1 flex-col ">
          <UsageChart
            data={timeSeriesData}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        </div>
      </Main>
    </div>
  );
}
