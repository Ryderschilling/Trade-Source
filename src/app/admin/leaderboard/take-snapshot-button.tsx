'use client';

import { useActionState } from 'react';
import { Camera } from 'lucide-react';
import { takeLeaderboardSnapshot } from './actions';

type State = { success?: string; error?: string } | null;

export function TakeSnapshotButton() {
  const [state, formAction, pending] = useActionState<State>(
    async () => takeLeaderboardSnapshot(),
    null
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        <Camera className="h-3.5 w-3.5" />
        {pending ? 'Saving…' : 'Take Snapshot'}
      </button>
      {state?.success && (
        <span className="text-xs text-emerald-600">{state.success}</span>
      )}
      {state?.error && (
        <span className="text-xs text-red-500">{state.error}</span>
      )}
    </form>
  );
}
