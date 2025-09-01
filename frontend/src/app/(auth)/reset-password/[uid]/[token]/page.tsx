'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordPageProps {
  params: Promise<{
    uid: string;
    token: string;
  }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.post(API_CONFIG.endpoints.auth.passwordResetConfirm, {
        uid: uid,
        token: token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      
      setIsSubmitted(true);
      toast.success('Password reset successfully');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response?.status === 400) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
      
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Password Reset Successfully
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Your password has been updated. You will be redirected to login shortly.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You can now use your new password to sign in to your account.
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

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Reset your password
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Enter your new password below to complete the reset process.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                className="pl-9 pr-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('new_password')}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.new_password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                className="pl-9 pr-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('confirm_password')}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <Link
              href="/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}