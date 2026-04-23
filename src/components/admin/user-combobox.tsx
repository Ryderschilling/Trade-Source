'use client';

import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface UserComboboxProps {
  value?: string;
  onChange: (id: string, option: UserOption) => void;
  placeholder?: string;
  className?: string;
  searchAction: (query: string) => Promise<UserOption[]>;
}

export function UserCombobox({
  value,
  onChange,
  placeholder = 'Search users…',
  className,
  searchAction,
}: UserComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await searchAction(q);
      setResults(res);
      setOpen(res.length > 0);
    });
  }

  function handleSelect(option: UserOption) {
    setQuery(option.full_name ?? option.email);
    setOpen(false);
    onChange(option.id, option);
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-8 h-8 text-sm"
        />
      </div>
      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-md max-h-48 overflow-y-auto">
          {results.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(option)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium">{option.full_name ?? option.email}</span>
                {option.full_name && (
                  <span className="ml-2 text-xs text-neutral-400">{option.email}</span>
                )}
                <span className="ml-2 text-xs text-neutral-400 capitalize">{option.role}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
