'use client';

import { useStore } from '@/app/store/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Key } from 'lucide-react';
import { useEffect } from 'react';

export function ApiKeySummary() {
  const { apiKeys, fetchApiKeys } = useStore();

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return (
    <Card className="bg-muted/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">API Keys</CardTitle>
        <Key className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{apiKeys.length}</div>
        <p className="text-muted-foreground text-xs">Active keys</p>
      </CardContent>
    </Card>
  );
}
