'use client';

import { useActionState } from 'react';
import { adminLogin } from './actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, {});

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950">
      <Card className="w-full max-w-sm border-neutral-800 bg-neutral-900 text-white shadow-2xl">
        <CardHeader className="pb-4 text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Source A Trade
          </p>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-neutral-300 text-sm">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Username"
                autoComplete="username"
                autoFocus
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-neutral-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-neutral-300 text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-neutral-500"
              />
            </div>
            {state.error && (
              <p className="text-sm text-red-400">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-white text-neutral-950 hover:bg-neutral-200"
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
