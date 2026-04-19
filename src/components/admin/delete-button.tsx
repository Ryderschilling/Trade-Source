'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  action: () => Promise<void>;
  label: string;
}

export function DeleteButton({ action, label }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Are you sure you want to delete this ${label}? This cannot be undone.`)) return;
    startTransition(async () => {
      await action();
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {pending ? 'Deleting…' : `Delete ${label}`}
    </Button>
  );
}
