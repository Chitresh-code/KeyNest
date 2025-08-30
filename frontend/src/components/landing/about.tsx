'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Code,
  Users,
  Zap,
  Github,
  // Star,
  // GitFork,
  // Download,
} from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Open Source First',
    description: 'Built by developers, for developers. Completely open source and transparent.',
  },
  {
    icon: Code,
    title: 'Developer Experience',
    description: 'Intuitive APIs, comprehensive documentation, and developer-friendly tools.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Growing community of contributors and users helping shape the future.',
  },
  {
    icon: Zap,
    title: 'Production Ready',
    description: 'Enterprise-grade reliability with battle-tested security and performance.',
  },
];

// Commented out until we have real stats
/*
const stats = [
  { label: 'GitHub Stars', value: '2.5K+', icon: Star },
  { label: 'Contributors', value: '50+', icon: Users },
  { label: 'Forks', value: '400+', icon: GitFork },
  { label: 'Downloads', value: '10K+', icon: Download },
];
*/

export default function About() {
  return (
      <section id="about" className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-background dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="px-4 py-2 mb-4 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              About KeyNest
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-foreground mb-6">
              Built by developers,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                for developers
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto">
              KeyNest was created out of frustration with existing environment variable
              management solutions. We wanted something secure, collaborative, and
              developer-friendly. So we built it.
            </p>
          </motion.div>
        </div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-8 mb-16"
        >
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-6 text-center">
              The Problem We&apos;re Solving
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-muted-foreground leading-relaxed">
                  Managing environment variables across multiple environments and team
                  members is a nightmare. Developers often resort to insecure methods
                  like shared documents, chat messages, or unencrypted files.
                </p>
                <p className="text-gray-600 dark:text-muted-foreground leading-relaxed">
                  KeyNest provides a secure, collaborative platform that makes
                  environment variable management easy while maintaining the highest
                  security standards. No more shared .env files in Slack!
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Open Source</div>
                  <div className="text-4xl font-bold text-green-600 mb-2">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Vendor Lock-in</div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">∞</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Customization</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-white/60 dark:bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4">
                    <value.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {/* Commented out until we have real stats */}
        
        {/* Community Stats */}
        {/*
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-8 mb-12"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">
              Growing Community
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
              Join our vibrant community of developers, DevOps engineers, and
              security professionals who are building the future of secret management.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3">
                  <stat.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        */}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">
            Ready to contribute or get started?
          </h3>
          <p className="text-gray-600 dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you want to use KeyNest for your projects or contribute to the
            open source community, we&apos;d love to have you join us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="min-w-[180px]">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="min-w-[180px]">
              <Github className="mr-2 h-4 w-4" />
              Contribute on GitHub
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}