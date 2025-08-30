'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showBackground?: boolean;
  imageClassName?: string;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const containerPadding = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2',
  xl: 'p-3'
};

export function Logo({ 
  className, 
  size = 'md', 
  variant = 'auto',
  showBackground = false,
  imageClassName
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to use
  const getLogoSrc = () => {
    if (variant === 'light') return '/logo.png';
    if (variant === 'dark') return '/logo w.png';
    
    // Auto mode: use theme to determine logo
    if (!mounted) return '/logo.png'; // Default for SSR
    
    const currentTheme = resolvedTheme || theme;
    return currentTheme === 'dark' ? '/logo w.png' : '/logo.png';
  };

  const logoImage = (
    <Image
      src={getLogoSrc()}
      alt="KeyNest Logo"
      width={48}
      height={48}
      className={cn(
        sizeClasses[size],
        'object-contain',
        imageClassName,
        className
      )}
      priority
    />
  );

  if (!showBackground) {
    return logoImage;
  }

  // Determine background based on variant and theme
  const getBackgroundClass = () => {
    if (variant === 'light') return 'bg-blue-600';
    if (variant === 'dark') return 'bg-white';
    
    // Auto mode: use theme to determine background
    if (!mounted) return 'bg-blue-600'; // Default for SSR
    
    const currentTheme = resolvedTheme || theme;
    return currentTheme === 'dark' ? 'bg-white' : 'bg-blue-600';
  };

  return (
    <div className={cn(
      'flex items-center justify-center rounded-lg overflow-hidden',
      getBackgroundClass(),
      containerPadding[size],
      className
    )}>
      {logoImage}
    </div>
  );
}

export default Logo;
