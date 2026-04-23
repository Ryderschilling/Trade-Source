'use client';

import { useTransition } from 'react';
import { removeUnsubscribe } from './actions';

export function RemoveUnsubscribeButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Re-subscribe ${email}? This will remove them from the unsubscribe list.`)) return;
    startTransition(() => { void removeUnsubscribe(email); });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-600 hover:underline font-medium disabled:opacity-40"
    >
      {pending ? 'Removing…' : 'Remove'}
    </button>
  );
}
