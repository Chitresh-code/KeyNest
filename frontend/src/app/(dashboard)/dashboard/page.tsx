'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth';
import { User, FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to KeyNest, {user?.first_name || user?.username}!
        </h1>
        <p className="text-gray-600">
          You&apos;ve successfully authenticated. This is your secure dashboard where you can
          manage your environment variables and collaborate with your team.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Projects</span>
            </CardTitle>
            <CardDescription>
              Manage your projects and their environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Create and organize projects to manage environment variables across different applications.
              </p>
              <div className="flex space-x-2">
                <Link href="/projects">
                  <Button size="sm">
                    View Projects
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account</span>
            </CardTitle>
            <CardDescription>
              Your account information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <p className="text-gray-900">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-green-600 font-medium">
                  {user?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Getting Started</CardTitle>
          <CardDescription>
            Here&apos;s what you can do with KeyNest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Create Projects</h4>
                  <p className="text-sm text-gray-600">
                    Organize your applications into projects for better management
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Manage Environments</h4>
                  <p className="text-sm text-gray-600">
                    Create development, staging, and production environments
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Store Variables Securely</h4>
                  <p className="text-sm text-gray-600">
                    All your environment variables are encrypted and secure
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Team Collaboration</h4>
                  <p className="text-sm text-gray-600">
                    Share projects with team members with role-based access
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Import & Export</h4>
                  <p className="text-sm text-gray-600">
                    Easily import from .env files or export for deployment
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">Audit Logs</h4>
                  <p className="text-sm text-gray-600">
                    Track all changes with comprehensive audit logging
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

