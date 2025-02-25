'use client';

import { useStore } from '@/app/store/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Activity } from 'lucide-react';
import { useEffect } from 'react';

export function UsageSummary() {
  const { usageSummary, fetchUsageSummary } = useStore();

  useEffect(() => {
    fetchUsageSummary();
  }, [fetchUsageSummary]);

  return (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">Usage</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">
          {usageSummary?.totalActions || 0}
        </div>
        <p className="text-muted-foreground text-xs">Total actions</p>
      </CardContent>
    </Card>
  );
}
