'use client';

import { useAuth } from '@/hooks/use-auth-hook';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Loading session...</div>;
  }

  if (!user) {
    // This should ideally not be shown as the effect would redirect.
    // It's a fallback or will be shown momentarily.
    return <div className="flex items-center justify-center min-h-screen bg-background text-foreground">Redirecting to login...</div>;
  }

  return <>{children}</>;
}
