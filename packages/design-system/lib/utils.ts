import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

const parseError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const handleError = (error: unknown): void => {
  const message = parseError(error);
  toast.error(message);
};
