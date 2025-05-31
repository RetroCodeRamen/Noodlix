'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth-hook';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react'; // Using Loader2 for a spinner

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showPasswordPrompt) {
      passwordInputRef.current?.focus();
    }
  }, [showPasswordPrompt]);

  const handleUsernameSubmit = () => {
    // Trigger validation for username
    form.trigger('username').then(isValid => {
      if (isValid) {
        setShowPasswordPrompt(true);
      }
    });
  };
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await login(data.username, data.password);
      if (!success) {
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password.',
          variant: 'destructive',
        });
        // Reset form for re-entry
        setShowPasswordPrompt(false);
        form.reset();
        setTimeout(() => usernameInputRef.current?.focus(), 0);
      }
      // Successful login will redirect via AuthProvider/AuthLayout effects
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during login.',
        variant: 'destructive',
      });
      setShowPasswordPrompt(false);
      form.reset();
      setTimeout(() => usernameInputRef.current?.focus(), 0);
    } finally {
      // Only set isSubmitting to false if login failed, otherwise page will redirect
      // However, if redirect takes time, button might reappear. This is okay for now.
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-code p-4 text-sm md:text-base">
      <div className="w-full max-w-xl">
        <p>Noodlix Kernel 1.0 (tty1) - Bashimi Shell</p>
        <p>&nbsp;</p>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          {!showPasswordPrompt && (
            <div className="flex items-center">
              <label htmlFor="username" className="whitespace-pre text-green-400">Noodlix login: </label>
              <Input
                id="username"
                ref={usernameInputRef}
                {...form.register('username')}
                className="flex-1 bg-transparent border-0 focus:ring-0 outline-none p-0 ml-2 text-inherit placeholder-muted-foreground/50"
                autoComplete="username"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUsernameSubmit();
                  }
                }}
              />
            </div>
          )}
          {form.formState.errors.username && !showPasswordPrompt && (
            <p className="text-red-400 ml-2">{form.formState.errors.username.message}</p>
          )}

          {showPasswordPrompt && (
            <>
              <div className="flex items-center">
                <span className="whitespace-pre text-green-400">Noodlix login: </span>
                <span className="ml-2">{form.getValues('username')}</span>
              </div>
              <div className="flex items-center">
                <label htmlFor="password" className="whitespace-pre text-green-400">Password: </label>
                <Input
                  id="password"
                  type="password"
                  ref={passwordInputRef}
                  {...form.register('password')}
                  className="flex-1 bg-transparent border-0 focus:ring-0 outline-none p-0 ml-2 text-inherit"
                  autoComplete="current-password"
                />
              </div>
            </>
          )}
          {form.formState.errors.password && showPasswordPrompt && (
             <p className="text-red-400 ml-2">{form.formState.errors.password.message}</p>
          )}

          {/* Hidden submit button, form submitted by Enter key */}
          <button type="submit" disabled={isSubmitting} className="hidden">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
           {isSubmitting && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Attempting login...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
