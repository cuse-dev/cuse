'use client';
import { Collapsible } from '@repo/design-system/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/design-system/components/ui/sidebar';
import {
  ChartColumnBigIcon,
  HomeIcon,
  LifeBuoyIcon,
  SendIcon,
  SquareTerminalIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const getData = (pathname: string) => {
  return {
    navMain: [
      {
        title: 'Home',
        url: '/',
        icon: HomeIcon,
        isActive: pathname === '/',
      },
      {
        title: 'Computer',
        url: '/computers',
        icon: SquareTerminalIcon,
        isActive: pathname.includes('/computers'),
      },
      {
        title: 'Usage',
        url: '/usage',
        icon: ChartColumnBigIcon,
        isActive: pathname.includes('/usage'),
      },
    ],
    navSecondary: [
      // {
      //   title: 'Webhooks',
      //   url: '/webhooks',
      //   icon: AnchorIcon,
      // },
      {
        title: 'Support',
        url: '/support',
        icon: LifeBuoyIcon,
      },
      {
        title: 'Feedback',
        url: '/feedback',
        icon: SendIcon,
      },
    ],
  };
};

export const GlobalSidebar = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const data = getData(pathname);

  return (
    <>
      <Sidebar
        className="absolute border-none bg-white! opacity-70 transition-opacity hover:opacity-100 lg:top-[8vh] lg:max-h-[80vh] xl:top-[16vh] xl:max-h-[60vh]"
        variant="floating"
      >
        {/* <Search /> */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible key={item.title} asChild>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="max-w-[70vw] pl-4 lg:mt-[8vh] lg:max-h-[80vh] lg:min-h-[80vh] xl:mt-[16vh] xl:max-h-[60vh] xl:min-h-[60vh]">
        {children}
      </SidebarInset>
    </>
  );
};
