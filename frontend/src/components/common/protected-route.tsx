'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  redirectTo = ROUTES.login,
  requireAuth = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, token, user, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return;

    // Check if we need authentication
    if (requireAuth) {
      // If not authenticated or missing critical auth data, redirect to login
      if (!isAuthenticated || !token || !user) {
        router.push(redirectTo);
        return;
      }
    } else {
      // If route should NOT be authenticated (like login/register pages)
      // and user IS authenticated, redirect to dashboard
      if (isAuthenticated && token && user) {
        router.push(ROUTES.dashboard);
        return;
      }
    }
  }, [isAuthenticated, token, user, isLoading, requireAuth, redirectTo, router]);

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For auth-required routes: show content only if authenticated
  if (requireAuth) {
    if (!isAuthenticated || !token || !user) {
      return null; // Will redirect via useEffect
    }
  } else {
    // For non-auth routes (login/register): show content only if NOT authenticated
    if (isAuthenticated && token && user) {
      return null; // Will redirect via useEffect
    }
  }

  return <>{children}</>;
}

// Higher-order component wrapper
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    requireAuth?: boolean;
  }
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute
        redirectTo={options?.redirectTo}
        requireAuth={options?.requireAuth}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}