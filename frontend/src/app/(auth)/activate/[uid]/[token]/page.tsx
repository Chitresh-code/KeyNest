'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

interface ActivatePageProps {
  params: Promise<{
    uid: string;
    token: string;
  }>;
}

type ActivationState = 'loading' | 'success' | 'error' | 'invalid';

export default function ActivatePage({ params }: ActivatePageProps) {
  const [state, setState] = useState<ActivationState>('loading');
  const [error, setError] = useState<string>('');
  const [uid, setUid] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setUid(resolvedParams.uid);
      setToken(resolvedParams.token);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const activateAccount = async () => {
      if (!uid || !token) return;
      
      try {
        await api.post(API_CONFIG.endpoints.auth.activate, {
          uid: uid,
          token: token,
        });
        
        setState('success');
        toast.success('Account activated successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Activation error:', error);
        
        if (error.response?.status === 400) {
          setState('invalid');
          setError('Invalid or expired activation link.');
        } else {
          setState('error');
          setError('Failed to activate account. Please try again.');
        }
        
        toast.error('Account activation failed');
      }
    };

    if (uid && token) {
      activateAccount();
    }
  }, [uid, token, router]);

  if (state === 'loading') {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Activating your account...
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Please wait while we verify your email and activate your account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state === 'success') {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to KeyNest!
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Your account has been successfully activated. You can now start managing your environment variables securely.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
              🎉 Account Activated Successfully!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              You can now:
            </p>
            <ul className="text-sm text-green-600 dark:text-green-400 mt-2 space-y-1">
              <li>• Create organizations and invite team members</li>
              <li>• Set up projects and environments</li>
              <li>• Securely store environment variables</li>
              <li>• Export/import configurations</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You will be redirected to the login page automatically, or you can click below to continue.
          </p>
          
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full">
                Continue to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error or Invalid state
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Activation Failed
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {error || 'Unable to activate your account.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
            What you can do:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
            <li>• Check if you clicked the correct link from your email</li>
            <li>• The activation link may have expired</li>
            <li>• Try registering again if needed</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Link href="/register" className="flex-1">
            <Button variant="outline" className="w-full">
              Register Again
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}