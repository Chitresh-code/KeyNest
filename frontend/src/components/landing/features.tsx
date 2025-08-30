'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Users,
  GitBranch,
  Lock,
  FileText,
  Upload,
  Zap,
  Database,
  Settings,
  Eye,
  RefreshCw,
  Layers,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description:
      'AES-256 encryption at rest with Fernet cryptography. All sensitive environment variables are encrypted before storage.',
    category: 'Security',
    highlights: ['AES-256 Encryption', 'Secure Key Management', 'Zero Trust Architecture'],
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Organization-based access control with granular role management. Admin, Editor, and Viewer roles for precise permissions.',
    category: 'Collaboration',
    highlights: ['Role-Based Access', 'Team Management', 'Permission Control'],
  },
  {
    icon: GitBranch,
    title: 'Multi-Environment Support',
    description:
      'Separate configurations for development, staging, and production environments. Keep your secrets organized and secure.',
    category: 'Organization',
    highlights: ['Dev/Stage/Prod', 'Environment Isolation', 'Configuration Management'],
  },
  {
    icon: FileText,
    title: 'Advanced Import/Export',
    description:
      'Multi-format support for .env, JSON, and YAML files. Built-in conflict resolution and batch operations.',
    category: 'Integration',
    highlights: ['.env Support', 'JSON/YAML Export', 'Conflict Resolution'],
  },
  {
    icon: Upload,
    title: 'File Upload Support',
    description:
      'Drag-and-drop file uploads with 10MB limit. Upload existing .env files and automatically parse variables.',
    category: 'Integration',
    highlights: ['Drag & Drop', '10MB Limit', 'Auto Parsing'],
  },
  {
    icon: Lock,
    title: 'Comprehensive Audit Logs',
    description:
      'Complete activity tracking for compliance and security. Monitor who accessed what and when.',
    category: 'Security',
    highlights: ['Activity Tracking', 'Compliance Ready', 'Security Monitoring'],
  },
  {
    icon: Zap,
    title: 'Batch Operations',
    description:
      'Atomic transactions for bulk variable operations. Update multiple environment variables simultaneously.',
    category: 'Performance',
    highlights: ['Atomic Transactions', 'Bulk Updates', 'Performance Optimized'],
  },
  {
    icon: Database,
    title: 'Production Ready',
    description:
      'Built with Django REST Framework. Supports PostgreSQL, MySQL, SQLite. Docker containerization included.',
    category: 'Infrastructure',
    highlights: ['Django REST', 'Multi-DB Support', 'Docker Ready'],
  },
  {
    icon: Settings,
    title: 'Rate Limiting & Protection',
    description:
      'Built-in protection against brute force and DDoS attacks. Configurable rate limits for different endpoints.',
    category: 'Security',
    highlights: ['DDoS Protection', 'Brute Force Prevention', 'Configurable Limits'],
  },
  {
    icon: Eye,
    title: 'Health Monitoring',
    description:
      'Load balancer compatible health checks. Comprehensive logging with security focus and monitoring.',
    category: 'Operations',
    highlights: ['Health Checks', 'Load Balancer Ready', 'Monitoring'],
  },
  {
    icon: RefreshCw,
    title: 'Version Control Ready',
    description:
      'Track changes and rollback capabilities. Version history for environment configurations (coming soon).',
    category: 'Organization',
    highlights: ['Change Tracking', 'Rollback Support', 'Version History'],
  },
  {
    icon: Layers,
    title: 'Scalable Architecture',
    description:
      '12-factor app compliance with environment-based configuration. Horizontal scaling and high availability.',
    category: 'Infrastructure',
    highlights: ['12-Factor App', 'Horizontal Scaling', 'High Availability'],
  },
];

const categories = [
  { name: 'Security', color: 'bg-red-100 text-red-700' },
  { name: 'Collaboration', color: 'bg-blue-100 text-blue-700' },
  { name: 'Organization', color: 'bg-green-100 text-green-700' },
  { name: 'Integration', color: 'bg-purple-100 text-purple-700' },
  { name: 'Performance', color: 'bg-orange-100 text-orange-700' },
  { name: 'Infrastructure', color: 'bg-gray-100 text-gray-700' },
  { name: 'Operations', color: 'bg-indigo-100 text-indigo-700' },
];

const getCategoryColor = (category: string) => {
  return categories.find(cat => cat.name === category)?.color || 'bg-gray-100 text-gray-700';
};

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="px-4 py-2 mb-4 bg-blue-100 text-blue-700">
              Powerful Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need for
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                secure environment management
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              KeyNest provides enterprise-grade security, team collaboration, and powerful
              integrations to streamline your development workflow while keeping your secrets safe.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <feature.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                          {feature.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCategoryColor(feature.category)}`}
                        >
                          {feature.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="space-y-1">
                        {feature.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-500">
                            <div className="w-1 h-1 bg-blue-600 rounded-full mr-2 flex-shrink-0"></div>
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to secure your environment variables?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of developers and teams who trust KeyNest to keep their secrets
              safe while enabling seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="#docs"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
