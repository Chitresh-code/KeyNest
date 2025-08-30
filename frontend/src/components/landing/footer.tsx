'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, Globe, Code } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { Logo } from '@/components/ui/logo';

const navigation = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'Documentation', href: '#docs' },
    { name: 'API Reference', href: '#docs' },
  ],
  company: [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' },
    { name: 'Contact', href: '#contact' },
  ],
  resources: [
    { name: 'Community', href: '#community' },
    { name: 'Help Center', href: '#help' },
    { name: 'Status', href: '#status' },
    { name: 'Changelog', href: '#changelog' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Security', href: '#security-policy' },
    { name: 'License', href: '#license' },
  ],
};

const socialLinks = [
  {
    name: 'GitHub',
    href: APP_CONFIG.socials.github,
    icon: Github,
  },
  {
    name: 'Website',
    href: APP_CONFIG.socials.website,
    icon: Globe,
  },
  {
    name: 'LinkedIn',
    href: APP_CONFIG.socials.linkedin,
    icon: Linkedin,
  },
  {
    name: 'Twitter',
    href: APP_CONFIG.socials.twitter,
    icon: Twitter,
  },
  {
    name: 'LeetCode',
    href: APP_CONFIG.socials.leetcode,
    icon: Code,
  },
  {
    name: 'Email',
    href: `mailto:${APP_CONFIG.socials.email}`,
    icon: Mail,
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Logo size="xl" variant="dark" />
              <span className="text-xl font-bold">{APP_CONFIG.name}</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              {APP_CONFIG.description}. Built for developers and enterprises who
              value security and collaboration.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <span className="sr-only">{link.name}</span>
                  <link.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {navigation.product.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {navigation.company.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {navigation.resources.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {navigation.legal.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Made with ❤️ by the open source community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}