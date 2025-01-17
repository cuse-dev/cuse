'use client';

import {
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const packageManagers = {
  npx: 'npx @cusedev/cli init',
  pnpm: 'pnpm create @cusedev/cli init',
  yarn: 'yarn create @cusedev/cli init',
  bun: 'bunx @cusedev/cli init',
} as const;

type PackageManager = keyof typeof packageManagers;

const Hero = () => {
  const [selectedPM, setSelectedPM] = useState<PackageManager>('npx');
  const [hasCopied, setHasCopied] = useState(false);

  const handleSelect = (pm: PackageManager) => {
    setSelectedPM(pm);
    navigator.clipboard.writeText(packageManagers[pm]);
    setHasCopied(true);
  };

  return (
    <section className="py-32 px-8">
      <div className="w-full">
        <div className="text-center">
          <a
            href={process.env.NEXT_PUBLIC_DOCS_URL + '/quickstart'}
            target="_blank"
            className="mx-auto mb-3 inline-flex items-center gap-3 border px-2 py-1 text-sm"
          >
            <Badge>NEW</Badge>
            Get started in 1 minute
            <span className="flex size-7 items-center justify-center bg-muted">
              <ArrowRight className="w-4" />
            </span>
          </a>
          <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-semibold lg:mb-7 lg:text-7xl">
            Unlock the power of computer use
          </h1>
          <p className="m mx-auto max-w-3xl text-muted-foreground lg:text-xl">
            Cuse is the all in one framework for implementing computer use for
            your applications. Seamlessly empower AI agents to interact with
            computers just like humans do.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <span className="flex items-center gap-2">
                    {packageManagers[selectedPM]}
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.keys(packageManagers).map((pm) => (
                  <DropdownMenuItem
                    key={pm}
                    onClick={() => handleSelect(pm as PackageManager)}
                  >
                    {pm}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="lg" variant="outline" asChild>
              <a href={process.env.NEXT_PUBLIC_GITHUB_URL + '/tree/main/examples/quickstart'} target="_blank">
                See the example
                <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
