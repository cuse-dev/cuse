import { cn } from '@repo/design-system/lib/utils';
import type { ReactNode } from 'react';

export function Main({
  children,
  isLoading,
  className,
}: {
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full max-h-full flex-col space-y-8 bg-transparent',
        className,
        isLoading && 'pointer-events-none opacity-70'
      )}
    >
      {children}
    </div>
  );
}
