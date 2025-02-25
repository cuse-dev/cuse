'use client';

import type { JsonValue } from '@prisma/client/runtime/library';
import type { Action } from '@repo/database';
import { DataTable } from '@repo/design-system/components/ui/data-table';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { format } from 'date-fns';

const columns: ColumnDef<Action>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Time',
    cell: ({ row }: { row: Row<Action> }) => {
      return format(new Date(row.original.createdAt), 'PPpp');
    },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }: { row: Row<Action> }) => {
      const action = row.original.data as {
        type: string;
        data: Record<string, JsonValue>;
      };
      return (
        <div className="flex flex-col">
          <span className="font-medium">{action.type}</span>
          <span className="text-muted-foreground text-sm">
            {JSON.stringify(action.data)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'metadata',
    header: 'Metadata',
    cell: ({ row }: { row: Row<Action> }) => {
      return (
        <pre className="text-sm">
          {JSON.stringify(row.original.metadata, null, 2)}
        </pre>
      );
    },
  },
];

interface ActionLogProps {
  actions: Action[];
}

export function ActionLog({ actions }: ActionLogProps) {
  return (
    <div className="flex h-full flex-col space-y-4 ">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Action Log</h2>
      </div>
      <div className="h-full bg-muted/50 ">
        <DataTable columns={columns} data={actions} />
      </div>
    </div>
  );
}
