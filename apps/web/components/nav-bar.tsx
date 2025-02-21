'use client';

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
import { Book, MenuIcon } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { ThemeToggle } from './theme-toggle';

const Navbar = () => {
  return (
    <section className="p-4">
      <div className="w-full">
        <nav className="flex items-center">
          <div className="flex flex-1 items-center gap-4">
            <img src="/logo.svg" alt="logo" className="w-8 dark:invert" />
            <span className="font-semibold text-3xl">cuse</span>
          </div>
          <div className="flex flex-1 justify-center">
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
          <div className="hidden flex-1 items-center justify-end gap-4 lg:flex">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <a
                href={process.env.NEXT_PUBLIC_DOCS_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Book />
                Docs
              </a>
            </Button>
            <Button asChild>
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL}
                target="_blank"
                rel="noreferrer"
              >
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
                    <span className="font-bold text-lg">cuse</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col">
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
                    <a
                      href={process.env.NEXT_PUBLIC_DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Book />
                      Documentation
                    </a>
                  </Button>
                  <Button asChild>
                    <a
                      href={process.env.NEXT_PUBLIC_GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
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
