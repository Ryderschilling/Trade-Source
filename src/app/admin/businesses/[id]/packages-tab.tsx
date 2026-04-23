'use client';

import { useState, useTransition } from 'react';
import { createPackage, updatePackage, deletePackage } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
  sort_order: number;
}

interface PackagesTabProps {
  contractorId: string;
  packages: Pkg[];
}

function PkgForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues?: Partial<Pkg>;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-2">
      <Input
        name="name"
        form="pkg-form"
        defaultValue={defaultValues?.name ?? ''}
        placeholder="Package name"
        className="h-8 text-sm"
        required
        autoFocus
      />
      <Textarea
        name="description"
        form="pkg-form"
        defaultValue={defaultValues?.description ?? ''}
        placeholder="Description (optional)"
        className="text-sm min-h-[60px]"
      />
      <Input
        name="price_label"
        form="pkg-form"
        defaultValue={defaultValues?.price_label ?? ''}
        placeholder="Price label (e.g. Starting at $99)"
        className="h-8 text-sm"
      />
      <form
        id="pkg-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
        className="flex gap-2"
      >
        <Button size="sm" type="submit" className="h-7">
          <Check className="w-3.5 h-3.5 mr-1" />
          {submitLabel}
        </Button>
        <Button size="sm" type="button" variant="outline" className="h-7" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1" />
          Cancel
        </Button>
      </form>
    </div>
  );
}

export function PackagesTab({ contractorId, packages }: PackagesTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleAdd(fd: FormData) {
    startTransition(async () => {
      await createPackage(contractorId, fd);
      setShowAdd(false);
    });
  }

  function handleUpdate(pkgId: string, fd: FormData) {
    startTransition(async () => {
      await updatePackage(pkgId, contractorId, fd);
      setEditId(null);
    });
  }

  function handleDelete(pkgId: string) {
    startTransition(async () => {
      await deletePackage(pkgId, contractorId);
    });
  }

  return (
    <div className="space-y-3">
      {packages.length === 0 && !showAdd && (
        <p className="text-sm text-neutral-400 py-4">No packages yet.</p>
      )}

      {packages.map((pkg) =>
        editId === pkg.id ? (
          <PkgForm
            key={pkg.id}
            defaultValues={pkg}
            onSubmit={(fd) => handleUpdate(pkg.id, fd)}
            onCancel={() => setEditId(null)}
            submitLabel="Save"
          />
        ) : (
          <div
            key={pkg.id}
            className="bg-white border border-neutral-200 rounded-lg px-4 py-3 flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium text-neutral-800">{pkg.name}</p>
              {pkg.price_label && (
                <p className="text-xs text-neutral-500 mt-0.5">{pkg.price_label}</p>
              )}
              {pkg.description && (
                <p className="text-xs text-neutral-400 mt-1">{pkg.description}</p>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => setEditId(pkg.id)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                onClick={() => handleDelete(pkg.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ),
      )}

      {showAdd ? (
        <PkgForm
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          submitLabel="Add Package"
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Package
        </Button>
      )}
    </div>
  );
}
