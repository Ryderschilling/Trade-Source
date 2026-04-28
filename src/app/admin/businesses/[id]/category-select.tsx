'use client';

import { useState, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  currentId: string | null;
  currentName: string | null;
  categories: Category[];
  onSave: (categoryId: string) => Promise<void>;
}

export function CategorySelect({ currentId, currentName, categories, onSave }: CategorySelectProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setDraft(currentId ?? '');
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function save() {
    startTransition(async () => {
      try {
        await onSave(draft);
        setEditing(false);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-1.5">
        <span className={currentName ? 'text-sm text-neutral-800' : 'text-sm text-neutral-400 italic'}>
          {currentName ?? '—'}
        </span>
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-700 transition-opacity"
          aria-label="Edit category"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 text-sm border border-neutral-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400"
        >
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button size="sm" onClick={save} disabled={isPending} className="h-7 w-7 p-0" aria-label="Save">
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={cancel} disabled={isPending} className="h-7 w-7 p-0" aria-label="Cancel">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
