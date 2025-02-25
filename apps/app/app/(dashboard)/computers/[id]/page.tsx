'use client';

import { useStore } from '@/app/store/store';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Card } from '@repo/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { useToast } from '@repo/design-system/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCcw, Settings, Square, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import { Header } from '../../components/header';
import { Main } from '../../components/main';
import { ActionLog } from './action-log';

export default function ComputerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const computerId = use(params).id;
  const {
    computers,
    fetchComputers,
    deleteComputer,
    startComputer,
    stopComputer,
  } = useStore();
  const { fetchActions, actions, isLoading } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchComputers();
    fetchActions(computerId);
  }, [fetchComputers, fetchActions, computerId]);

  const currentComputer = computers.find((c) => c.id === computerId);

  if (!currentComputer) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 font-bold text-2xl">Computer not found</h1>
        <Button onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this computer?'
    );
    if (confirmed) {
      await deleteComputer(computerId);
      router.push('/computers');
    }
  };

  const handleStart = async () => {
    try {
      await startComputer(computerId);
      toast({
        title: 'Computer started successfully',
      });
    } catch (_error) {
      toast({
        title: 'Failed to start computer',
        variant: 'destructive',
      });
    }
  };

  const handleStop = async () => {
    try {
      await stopComputer(computerId);
      toast({
        title: 'Computer stopped successfully',
      });
    } catch (_error) {
      toast({
        title: 'Failed to stop computer',
        variant: 'destructive',
      });
    }
  };

  const handleRestart = async () => {
    try {
      await stopComputer(computerId);
      await startComputer(computerId);
      toast({
        title: 'Computer restarted successfully',
      });
    } catch (_error) {
      toast({
        title: 'Failed to restart computer',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-full flex-col space-y-2 pb-2">
      <Header pages={[]} page="Computer">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              Computer: {currentComputer.name}
            </h1>
            <p className="text-muted-foreground">Manage your computers.</p>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentComputer.sandboxId ? (
                  <DropdownMenuItem onClick={handleStop}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleStart}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Start
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleRestart}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Restart
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Header>
      <Main
        isLoading={isLoading}
        className="max-h-full space-y-8 bg-transparent"
      >
        <Card className="border-none bg-muted/50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-medium text-gray-500 text-sm">Base URL</h3>
              <p className="font-mono text-sm">
                {`${window.location.origin}/api/computers/${currentComputer.name}`}
              </p>
            </div>
            <div>
              <h2 className="font-medium text-gray-500 text-sm">Status</h2>
              <Badge
                variant={currentComputer.sandboxId ? 'default' : 'secondary'}
              >
                {currentComputer.sandboxId ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            <div>
              <h2 className="font-medium text-gray-500 text-sm">Platform</h2>
              <p>{currentComputer.platform}</p>
            </div>
            <div>
              <h2 className="font-medium text-gray-500 text-sm">Created</h2>
              <p>
                {formatDistanceToNow(new Date(currentComputer.createdAt))} ago
              </p>
            </div>

            {currentComputer.sandboxId && (
              <div>
                <h2 className="font-medium text-gray-500 text-sm">
                  Sandbox ID
                </h2>
                <p className="font-mono">{currentComputer.sandboxId}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex h-full flex-1 flex-col">
          <ActionLog actions={actions} />
        </div>
      </Main>
    </div>
  );
}
