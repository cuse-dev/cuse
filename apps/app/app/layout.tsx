import { DesignSystemProvider } from '@repo/design-system';
import { Toaster } from '@repo/design-system/components/ui/toaster';
import { fonts } from '@repo/design-system/lib/fonts';
import '@repo/design-system/styles/globals.css';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body className="lg:!pr-[10vw] lg:!pl-[10vw] xl:!pr-[15vw] xl:!pl-[15vw]">
      <Toaster />
      <DesignSystemProvider>{children}</DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
