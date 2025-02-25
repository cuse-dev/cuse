'use client';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import type { Computer } from '@repo/services';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';

export const columns: ColumnDef<Computer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.getValue('name'),
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
    cell: ({ row }) => row.getValue('platform'),
  },
  {
    accessorKey: 'sandboxId',
    header: 'Status',
    cell: ({ row }: { row: Row<Computer> }) => {
      const sandboxId = row.getValue('sandboxId');
      return (
        <Badge variant={sandboxId ? 'default' : 'secondary'}>
          {sandboxId ? 'Running' : 'Stopped'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }: { row: Row<Computer> }) => {
      const date = new Date(row.getValue('createdAt'));
      return date.toLocaleDateString();
    },
  },
  {
    id: 'actions',
    cell: ({ row }: { row: Row<Computer> }) => {
      const computer = row.original;
      const router = useRouter();

      return (
        <div className="flex justify-end opacity-0 group-hover:opacity-100 ">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/computers/${computer.id}`);
            }}
            className="h-8 w-8 transition-opacity "
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Open details</span>
          </Button>
        </div>
      );
    },
  },
];

// Custom hook for row navigation
const useComputerRowProps = () => {
  const router = useRouter();

  return (row: Row<Computer>) => ({
    onClick: () => router.push(`/computers/${row.original.id}`),
    onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        router.push(`/computers/${row.original.id}`);
      }
    },
    className:
      'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group',
    role: 'button',
    tabIndex: 0,
  });
};

// Export the hook instead of the direct function
export { useComputerRowProps as rowProps };
