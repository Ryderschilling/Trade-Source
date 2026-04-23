'use client';

import { useState, useTransition } from 'react';
import { createCategory, updateCategory, deleteCategory } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  group_id: string | null;
  group_name: string | null;
  sort_order: number;
  business_count: number;
}

interface Props {
  categories: Category[];
  groups: Group[];
}

function CategoryForm({
  defaults,
  groups,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaults?: Partial<Category>;
  groups: Group[];
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input name="name" defaultValue={defaults?.name ?? ''} placeholder="Name" className="h-8 text-sm" required autoFocus />
        <Input name="slug" defaultValue={defaults?.slug ?? ''} placeholder="slug" className="h-8 text-sm font-mono" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="icon" defaultValue={defaults?.icon ?? ''} placeholder="Icon (emoji or URL)" className="h-8 text-sm" />
        <select
          name="group_id"
          defaultValue={defaults?.group_id ?? ''}
          className="h-8 text-sm rounded-md border border-neutral-200 bg-white px-2"
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <Input name="description" defaultValue={defaults?.description ?? ''} placeholder="Description (optional)" className="h-8 text-sm" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
        className="flex gap-2"
      >
        <Button size="sm" type="submit" className="h-7">
          <Check className="w-3.5 h-3.5 mr-1" />{submitLabel}
        </Button>
        <Button size="sm" type="button" variant="outline" className="h-7" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1" />Cancel
        </Button>
      </form>
    </div>
  );
}

export function CategoriesTab({ categories, groups }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleAdd(fd: FormData) {
    startTransition(async () => {
      await createCategory(fd);
      setShowAdd(false);
    });
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      await updateCategory(id, fd);
      setEditId(null);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteCategory(id); });
  }

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold">Slug</th>
              <th className="text-left px-4 py-2.5 font-semibold">Group</th>
              <th className="text-left px-4 py-2.5 font-semibold">Businesses</th>
              <th className="text-left px-4 py-2.5 font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">No categories yet.</td>
              </tr>
            )}
            {categories.map((cat) =>
              editId === cat.id ? (
                <tr key={cat.id}>
                  <td colSpan={5} className="px-4 py-3">
                    <CategoryForm
                      defaults={cat}
                      groups={groups}
                      onSubmit={(fd) => handleUpdate(cat.id, fd)}
                      onCancel={() => setEditId(null)}
                      submitLabel="Save"
                    />
                  </td>
                </tr>
              ) : (
                <tr key={cat.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <span className="mr-1.5">{cat.icon}</span>
                    <span className="font-medium text-neutral-800">{cat.name}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{cat.slug}</td>
                  <td className="px-4 py-2.5">
                    {cat.group_name
                      ? <Badge variant="secondary" className="text-xs">{cat.group_name}</Badge>
                      : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">{cat.business_count}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setEditId(cat.id)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {showAdd ? (
        <CategoryForm groups={groups} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} submitLabel="Add Category" />
      ) : (
        <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />Add Category
        </Button>
      )}
    </div>
  );
}
