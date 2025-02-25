'use client';
import { useStore } from '@/app/store/store';
import { DataTable } from '@repo/design-system/components/ui/data-table';
import { useEffect } from 'react';
import { Header } from '../components/header';
import { Main } from '../components/main';
import { columns, rowProps } from './columns';
import { CreateComputerDialog } from './create-dialog';

export default function ComputerPage() {
  const { computers, isLoading, fetchComputers } = useStore();
  const getRowProps = rowProps();

  useEffect(() => {
    fetchComputers();
  }, [fetchComputers]);

  return (
    <>
      <div className="flex h-full flex-col space-y-2 pb-2">
        <Header pages={[]} page="Computer">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h1 className="font-bold text-2xl tracking-tight">
                All Computer Instances
              </h1>
              <p className="text-muted-foreground">Manage your computers.</p>
            </div>
            <CreateComputerDialog />
          </div>
        </Header>
        <Main className="bg-muted/50" isLoading={isLoading}>
          <DataTable
            columns={columns}
            data={computers}
            isLoading={isLoading}
            noResultsMessage="No computers found."
            getRowProps={getRowProps}
          />
        </Main>
      </div>
    </>
  );
}
