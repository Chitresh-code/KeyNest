'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  GitBranch,
  Lock,
  ArrowRight,
  Github,
  Star,
} from 'lucide-react';
import { APP_CONFIG, ROUTES } from '@/lib/constants';

const features = [
  {
    icon: Shield,
    text: 'AES-256 Encryption',
  },
  {
    icon: Users,
    text: 'Team Collaboration',
  },
  {
    icon: GitBranch,
    text: 'Multi-Environment',
  },
  {
    icon: Lock,
    text: 'Audit Logging',
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJhIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPgo8L3BhdHRlcm4+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPgo8L3N2Zz4=')] opacity-40"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              <Star className="h-4 w-4 mr-2" />
              Open Source & Production Ready
            </Badge>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Secure Environment
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Variable Management
            </span>
          </motion.h1>

          {/* Hero Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {APP_CONFIG.description}. Built for developers and enterprises who
            need secure, collaborative environment management with enterprise-grade
            encryption and audit trails.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200"
              >
                <feature.icon className="h-4 w-4 text-blue-600" />
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href={ROUTES.register}>
              <Button size="lg" className="min-w-[180px] group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href={APP_CONFIG.repository} target="_blank">
              <Button variant="outline" size="lg" className="min-w-[180px]">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <p className="text-sm text-gray-500 mb-4">
              Trusted by developers worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500">Open Source</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">AES-256</div>
                <div className="text-sm text-gray-500">Encryption</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">SOC 2</div>
                <div className="text-sm text-gray-500">Ready</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-500">Scalability</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
