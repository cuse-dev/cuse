'use client';

import { Book, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from './theme-toggle';
import { FaGithub } from 'react-icons/fa';

const Navbar = () => {
  return (
    <section className="p-4">
      <div className="w-full">
        <nav className="flex items-center">
          <div className="flex-1 flex items-center gap-4">
            <img src="/logo.svg" alt="logo" className="w-8 dark:invert" />
            <span className="text-3xl font-semibold">cuse</span>
          </div>
          <div className="flex-1 flex justify-center">
            <NavigationMenu className="hidden lg:block">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="#features"
                    className={navigationMenuTriggerStyle()}
                  >
                    Features
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="#waitlist"
                    className={navigationMenuTriggerStyle()}
                  >
                    Waitlist
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="#benefits"
                    className={navigationMenuTriggerStyle()}
                  >
                    Benefits
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="#community"
                    className={navigationMenuTriggerStyle()}
                  >
                    Community
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    href="#roadmap"
                    className={navigationMenuTriggerStyle()}
                  >
                    Roadmap
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex-1 hidden items-center gap-4 lg:flex justify-end">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <a href={process.env.NEXT_PUBLIC_DOCS_URL} target="_blank">
                <Book />
                Docs
              </a>
            </Button>
            <Button asChild>
              <a href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank">
                <FaGithub />
                GitHub
              </a>
            </Button>
          </div>
          <Sheet>
            <div className="flex items-center gap-4 lg:hidden">
              <ThemeToggle />
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </SheetTrigger>
            </div>
            <SheetContent side="top" className="max-h-screen overflow-scroll">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-4">
                    <img
                      src="logo.svg"
                      alt="logo"
                      className="w-8 dark:invert"
                    />
                    <span className="text-lg font-bold">cuse</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col mt-8">
                <div className="flex flex-col gap-4">
                  <a href="#features" className="font-medium">
                    Features
                  </a>
                  <a href="#waitlist" className="font-medium">
                    Waitlist
                  </a>
                  <a href="#benefits" className="font-medium">
                    Benefits
                  </a>
                  <a href="#community" className="font-medium">
                    Community
                  </a>
                  <a href="#roadmap" className="font-medium">
                    Roadmap
                  </a>
                </div>
                <div className="mt-6 flex flex-col gap-4">
                  <Button variant="outline" asChild>
                    <a href={process.env.NEXT_PUBLIC_DOCS_URL} target="_blank">
                      <Book />
                      Documentation
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank">
                      <FaGithub />
                      GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
};

export default Navbar;
