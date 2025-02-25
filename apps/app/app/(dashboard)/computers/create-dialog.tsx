'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useStore } from '@/app/store/store';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/design-system/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/design-system/components/ui/form';
import { Input } from '@repo/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { useToast } from '@repo/design-system/components/ui/use-toast';
import { useState } from 'react';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

const PLATFORMS = [
  { value: 'LINUX', label: 'Linux', disabled: false },
  { value: 'BROWSER', label: 'Browser', disabled: false },
  { value: 'WINDOWS', label: 'Windows', disabled: true },
  { value: 'MACOS', label: 'macOS', disabled: true },
] as const;

const formSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        'Name must be lowercase alphanumeric with optional hyphens (e.g. my-computer-123)',
    })
    .min(2, {
      message: 'Name must be at least 2 characters.',
    }),
  platform: z.nativeEnum({
    MACOS: 'MACOS',
    WINDOWS: 'WINDOWS',
    LINUX: 'LINUX',
    BROWSER: 'BROWSER',
  }),
  metadata: z.record(z.any()).default({}),
});

export function CreateComputerDialog() {
  const [open, setOpen] = useState(false);
  const { createComputer } = useStore();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: uniqueNamesGenerator({
        dictionaries: [colors, animals],
        separator: '-',
        style: 'lowerCase',
      }),
      platform: PLATFORMS[0].value,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createComputer({
        ...values,
        platform: values.platform as 'LINUX' | 'WINDOWS' | 'BROWSER' | 'MACOS',
      });
      toast({
        title: 'Computer created',
        description: `Successfully created computer "${values.name}"`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create computer',
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Computer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Computer</DialogTitle>
          <DialogDescription>
            Add a new computer to your organization. Fill out the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Computer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem
                            key={platform.value}
                            value={platform.value}
                            disabled={platform.disabled}
                          >
                            {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
