'use client';

import { useState, useTransition } from 'react';
import { ContractorCombobox } from '@/components/admin/contractor-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchContractors, addFeaturedPlacement } from './actions';
import { Plus, Check, X } from 'lucide-react';

const SLOTS = [
  { value: 'homepage_hero',     label: 'Homepage Hero'     },
  { value: 'homepage_featured', label: 'Homepage Featured' },
  { value: 'sidebar',           label: 'Sidebar'           },
  { value: 'category_top',      label: 'Category Top'      },
];

export function AddPlacementForm() {
  const [open, setOpen] = useState(false);
  const [contractorId, setContractorId] = useState('');
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('contractor_id', contractorId);
    startTransition(async () => {
      await addFeaturedPlacement(fd);
      setOpen(false);
      setContractorId('');
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="h-8" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5 mr-1" />Add Placement
      </Button>
    );
  }

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-neutral-700">Add Featured Placement</p>
      <ContractorCombobox
        onChange={(id) => setContractorId(id)}
        searchAction={searchContractors}
        placeholder="Search business…"
      />
      <form onSubmit={handleSubmit} className="space-y-2">
        <select
          name="slot"
          required
          className="w-full h-8 text-sm rounded-md border border-neutral-200 bg-white px-2"
        >
          <option value="">Select slot…</option>
          {SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Starts at (optional)</label>
            <Input name="starts_at" type="date" className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Ends at (optional)</label>
            <Input name="ends_at" type="date" className="h-8 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" type="submit" className="h-7" disabled={!contractorId}>
            <Check className="w-3.5 h-3.5 mr-1" />Add
          </Button>
          <Button size="sm" type="button" variant="outline" className="h-7" onClick={() => setOpen(false)}>
            <X className="w-3.5 h-3.5 mr-1" />Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
