'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  AlertTriangle,
  Fingerprint,
  Database,
  Server,
} from 'lucide-react';

const securityFeatures = [
  {
    icon: Shield,
    title: 'AES-256 Encryption',
    description: 'Military-grade encryption using Fernet cryptography',
    details: ['Encryption at rest', 'Secure key derivation', 'Zero-knowledge architecture'],
  },
  {
    icon: Fingerprint,
    title: 'JWT Authentication',
    description: 'Secure token-based authentication with refresh tokens',
    details: ['Stateless authentication', 'Token expiration', 'Secure sessions'],
  },
  {
    icon: Eye,
    title: 'Role-Based Access Control',
    description: 'Granular permissions with Admin, Editor, and Viewer roles',
    details: ['Fine-grained permissions', 'Organization isolation', 'Principle of least privilege'],
  },
  {
    icon: FileCheck,
    title: 'Comprehensive Audit Logs',
    description: 'Complete activity tracking for compliance and forensics',
    details: ['User activity tracking', 'IP address logging', 'Compliance ready'],
  },
  {
    icon: AlertTriangle,
    title: 'Rate Limiting & DDoS Protection',
    description: 'Built-in protection against brute force and abuse',
    details: ['Configurable rate limits', 'IP-based throttling', 'Attack mitigation'],
  },
  {
    icon: Database,
    title: 'Secure Data Storage',
    description: 'Encrypted database storage with secure key management',
    details: ['Database encryption', 'Secure backups', 'Key rotation support'],
  },
];

const complianceStandards = [
  {
    name: 'SOC 2 Ready',
    description: 'Security controls and audit trails',
    icon: FileCheck,
  },
  {
    name: 'GDPR Compliant',
    description: 'Data protection and privacy controls',
    icon: Shield,
  },
  {
    name: 'HIPAA Ready',
    description: 'Healthcare data protection standards',
    icon: Lock,
  },
  {
    name: 'ISO 27001',
    description: 'Information security management',
    icon: Server,
  },
];

export default function Security() {
  return (
    <section id="security" className="py-20 bg-white dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="px-4 py-2 mb-4 bg-red-100 text-red-700">
              Enterprise Security
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-foreground mb-6">
              Security is our
              <br />
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                top priority
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto">
              KeyNest implements multiple layers of security to protect your sensitive
              environment variables. From encryption to access control, we've got you covered.
            </p>
          </motion.div>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-card border-gray-200 dark:border-border">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <feature.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2 leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-muted-foreground mb-4 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="space-y-1">
                        {feature.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
                            <div className="w-1 h-1 bg-red-600 rounded-full mr-2 flex-shrink-0"></div>
                            <span>{detail}</span>
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

        {/* Compliance Standards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="bg-gray-50 dark:bg-card rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4">
              Built for Compliance
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
              KeyNest is designed to meet industry standards and regulations,
              making it easy for your organization to maintain compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStandards.map((standard, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 bg-white dark:bg-background rounded-lg border border-gray-200 dark:border-border"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                  <standard.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                  {standard.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  {standard.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
              Want to learn more about our security practices?
            </p>
            <a
              href="#docs"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Read Security Documentation →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}