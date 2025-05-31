
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-hook';
import AuthenticatedTerminalPage from '@/app/(auth)/page'; // Import the component from (auth)/page.tsx
import AuthLayout from '@/app/(auth)/layout'; // Import the AuthLayout

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not loading and no user
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    // While AuthProvider is checking auth state and showing "Loading WebNix...",
    // this page should render nothing to avoid conflicting messages or layout shifts.
    return null;
  }

  if (!user) {
    // If still no user after loading is complete, AuthProvider or this page's useEffect
    // will handle redirection to /login. Render nothing here as well.
    return null;
  }

  // If we reach here, isLoading is false and user is present.
  // Render the actual terminal content, wrapped in AuthLayout.
  // This ensures that src/app/page.tsx (for route "/") correctly displays
  // the authenticated UI.
  return (
    <AuthLayout>
      <AuthenticatedTerminalPage />
    </AuthLayout>
  );
}
