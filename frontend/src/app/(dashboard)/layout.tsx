'use client';

import Link from 'next/link';
import { Shield, FolderOpen, Home, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth';
import { useLogout } from '@/lib/api/auth';
import { APP_CONFIG } from '@/lib/constants';
import ProtectedRoute from '@/components/common/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore(state => state.user);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {APP_CONFIG.name}
                  </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                  <Link 
                    href="/dashboard" 
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    href="/projects" 
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Projects</span>
                  </Link>
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{user?.full_name || user?.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}