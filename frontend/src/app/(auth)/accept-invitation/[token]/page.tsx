'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

interface AcceptInvitationPageProps {
  params: {
    token: string;
  };
}

type InvitationState = 'loading' | 'success' | 'error' | 'invalid' | 'expired';

interface InvitationInfo {
  organization_name: string;
  inviter_name: string;
  role: string;
}

export default function AcceptInvitationPage({ params }: AcceptInvitationPageProps) {
  const [state, setState] = useState<InvitationState>('loading');
  const [error, setError] = useState<string>('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        const response = await api.post('/auth/invitations/accept/', {
          token: params.token,
        });
        
        setState('success');
        setInvitationInfo(response.data);
        toast.success('Organization invitation accepted!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (error: any) {
        console.error('Invitation acceptance error:', error);
        
        if (error.response?.status === 400) {
          const errorData = error.response.data;
          if (errorData.error?.includes('expired')) {
            setState('expired');
            setError('This invitation has expired.');
          } else if (errorData.error?.includes('already')) {
            setState('error');
            setError('You are already a member of this organization.');
          } else {
            setState('invalid');
            setError('Invalid invitation link.');
          }
        } else if (error.response?.status === 404) {
          setState('invalid');
          setError('Invitation not found.');
        } else {
          setState('error');
          setError('Failed to accept invitation. Please try again.');
        }
        
        toast.error('Failed to accept invitation');
      }
    };

    if (params.token) {
      acceptInvitation();
    } else {
      setState('invalid');
      setError('Invalid invitation link.');
    }
  }, [params.token, router]);

  if (state === 'loading') {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Processing invitation...
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Please wait while we add you to the organization.
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
            Welcome to the team!
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            You have successfully joined the organization.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {invitationInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
              <div className="flex items-center justify-center mb-3">
                <Building className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {invitationInfo.organization_name}
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                You have been added as a <strong>{invitationInfo.role}</strong>
                {invitationInfo.inviter_name && (
                  <> by <strong>{invitationInfo.inviter_name}</strong></>
                )}
              </p>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                What you can do now:
              </span>
            </div>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Access organization projects and environments</li>
              <li>• Collaborate with team members</li>
              <li>• Manage environment variables based on your role</li>
              <li>• View audit logs and activity</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You will be redirected to the dashboard automatically, or click below to continue.
          </p>
          
          <div className="pt-4">
            <Link href="/dashboard">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error, Invalid, or Expired state
  const getErrorTitle = () => {
    switch (state) {
      case 'expired':
        return 'Invitation Expired';
      case 'invalid':
        return 'Invalid Invitation';
      default:
        return 'Invitation Failed';
    }
  };

  const getErrorIcon = () => {
    return <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />;
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          {getErrorIcon()}
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          {getErrorTitle()}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {error || 'Unable to process your invitation.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
            What you can do:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
            {state === 'expired' ? (
              <>
                <li>• Request a new invitation from the organization admin</li>
                <li>• Check if you have a newer invitation email</li>
                <li>• Contact the person who invited you</li>
              </>
            ) : (
              <>
                <li>• Check if you clicked the correct link from your email</li>
                <li>• Ensure you're logged in to the correct account</li>
                <li>• Contact the organization admin for a new invitation</li>
                <li>• Try accessing the link from the original email</li>
              </>
            )}
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}