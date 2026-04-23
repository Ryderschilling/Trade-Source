'use client';

import { useState, useRef, useTransition } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'number' | 'boolean' | 'textarea';

interface EditFieldProps {
  value: string | number | boolean | null | undefined;
  type?: FieldType;
  label?: string;
  placeholder?: string;
  onSave: (value: string | number | boolean) => Promise<void>;
  readOnly?: boolean;
  className?: string;
  emptyLabel?: string;
}

export function EditField({
  value,
  type = 'text',
  label,
  placeholder,
  onSave,
  readOnly = false,
  className,
  emptyLabel = '—',
}: EditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | number | boolean>(value ?? (type === 'boolean' ? false : ''));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  function startEdit() {
    setDraft(value ?? (type === 'boolean' ? false : ''));
    setError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
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

  const displayValue =
    type === 'boolean'
      ? (value ? 'Yes' : 'No')
      : (value !== null && value !== undefined && value !== '' ? String(value) : emptyLabel);

  if (readOnly) {
    return (
      <span className={cn('text-sm text-neutral-700', className)}>
        {displayValue}
      </span>
    );
  }

  if (!editing) {
    return (
      <div className={cn('group flex items-start gap-1.5', className)}>
        {label && <span className="text-xs text-neutral-500 w-28 flex-shrink-0 pt-0.5">{label}</span>}
        <span className={cn('text-sm flex-1', value == null || value === '' ? 'text-neutral-400 italic' : 'text-neutral-800')}>
          {displayValue}
        </span>
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-700 transition-opacity"
          aria-label="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && <span className="text-xs text-neutral-500">{label}</span>}
      <div className="flex items-start gap-1.5">
        {type === 'boolean' ? (
          <Switch
            checked={Boolean(draft)}
            onCheckedChange={(v) => setDraft(v)}
          />
        ) : type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={String(draft)}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="text-sm min-h-[80px]"
            onKeyDown={(e) => e.key === 'Escape' && cancel()}
          />
        ) : (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={type === 'number' ? 'number' : 'text'}
            value={String(draft)}
            onChange={(e) =>
              setDraft(type === 'number' ? Number(e.target.value) : e.target.value)
            }
            placeholder={placeholder}
            className="h-7 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
          />
        )}
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            onClick={save}
            disabled={isPending}
            className="h-7 w-7 p-0"
            aria-label="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={cancel}
            disabled={isPending}
            className="h-7 w-7 p-0"
            aria-label="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
