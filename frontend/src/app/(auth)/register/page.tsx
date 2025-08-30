'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegister } from '@/lib/api/auth';
import type { RegisterRequest } from '@/types';

const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must be less than 150 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  firstName: z
    .string()
    .max(150, 'First name must be less than 150 characters')
    .optional(),
  lastName: z
    .string()
    .max(150, 'Last name must be less than 150 characters')
    .optional(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const registerData: RegisterRequest = {
      username: data.username,
      email: data.email,
      password: data.password,
      confirm_password: data.confirmPassword,
      first_name: data.firstName || '',
      last_name: data.lastName || '',
    };
    
    registerMutation.mutate(registerData);
  };

  const isLoading = isSubmitting || registerMutation.isPending;

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Join KeyNest and start managing your environment variables securely.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Username *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                className="pl-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('username')}
                disabled={isLoading}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="pl-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className="bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="pl-9 pr-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('password')}
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
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm password *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="pl-9 pr-9 bg-white/50 dark:bg-gray-700/50 dark:text-white dark:border-gray-600"
                {...register('confirmPassword')}
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
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Privacy */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

