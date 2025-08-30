'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Github } from 'lucide-react';
import { APP_CONFIG, ROUTES } from '@/lib/constants';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Security', href: '#security' },
  { name: 'Documentation', href: '#docs' },
  { name: 'About', href: '#about' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo size="xl" />
            <span className="text-xl font-bold text-gray-900 dark:text-foreground">
              {APP_CONFIG.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href={APP_CONFIG.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
            <ThemeToggle />
            <Link href={ROUTES.login}>
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href={ROUTES.register}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col space-y-6 mt-6">
                <Link href="/" className="flex items-center space-x-2">
                  <Logo size="xl" />
                  <span className="text-xl font-bold text-gray-900 dark:text-foreground">
                    {APP_CONFIG.name}
                  </span>
                </Link>

                <nav className="flex flex-col space-y-4">
                  {navigation.map(item => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-600 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col space-y-3">
                  <Link href={ROUTES.login}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href={ROUTES.register}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-border">
                  <Link
                    href={APP_CONFIG.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
