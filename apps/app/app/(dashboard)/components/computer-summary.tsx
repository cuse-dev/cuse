'use client';

import { useStore } from '@/app/store/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Laptop } from 'lucide-react';
import { useEffect } from 'react';

export function ComputerSummary() {
  const { computers, fetchComputers } = useStore();

  useEffect(() => {
    fetchComputers();
  }, [fetchComputers]);

  const runningComputers = computers.filter((c) => c.sandboxId !== null).length;

  return (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">Computers</CardTitle>
        <Laptop className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{computers.length}</div>
        <p className="text-muted-foreground text-xs">
          {runningComputers} running
        </p>
      </CardContent>
    </Card>
  );
}
