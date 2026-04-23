'use client';

import { useState, useTransition } from 'react';
import { upsertSetting, deleteSetting } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';

interface Setting {
  key: string;
  value: unknown;
  updated_at: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function valuePreview(v: unknown): string {
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

export function SettingsEditor({ settings }: { settings: Setting[] }) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [, startTransition] = useTransition();

  function startEdit(s: Setting) {
    setEditKey(s.key);
    setEditVal(valuePreview(s.value));
  }

  function handleSave(key: string) {
    startTransition(async () => {
      await upsertSetting(key, editVal);
      setEditKey(null);
    });
  }

  function handleDelete(key: string) {
    startTransition(async () => { await deleteSetting(key); });
  }

  function handleAdd() {
    if (!newKey.trim()) return;
    startTransition(async () => {
      await upsertSetting(newKey.trim(), newVal);
      setShowAdd(false);
      setNewKey('');
      setNewVal('');
    });
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold">Key</th>
              <th className="text-left px-4 py-2.5 font-semibold">Value</th>
              <th className="text-left px-4 py-2.5 font-semibold">Updated</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">No settings yet.</td>
              </tr>
            )}
            {settings.map((s) =>
              editKey === s.key ? (
                <tr key={s.key} className="border-b border-neutral-50">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-neutral-700">{s.key}</span>
                  </td>
                  <td className="px-4 py-2.5" colSpan={2}>
                    <Textarea
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="text-xs font-mono min-h-[60px]"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleSave(s.key)}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => setEditKey(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={s.key} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-700 align-top">{s.key}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-neutral-500 max-w-xs truncate">
                    {valuePreview(s.value)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-neutral-400 whitespace-nowrap">{fmt(s.updated_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => startEdit(s)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDelete(s.key)}>
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
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="setting.key"
            className="h-8 text-sm font-mono"
            autoFocus
          />
          <Textarea
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder='Value (string or JSON: true, 42, {"key": "val"})'
            className="text-xs font-mono min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7" onClick={handleAdd} disabled={!newKey.trim()}>
              <Check className="w-3.5 h-3.5 mr-1" />Add Setting
            </Button>
            <Button size="sm" variant="outline" className="h-7" onClick={() => setShowAdd(false)}>
              <X className="w-3.5 h-3.5 mr-1" />Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />Add Setting
        </Button>
      )}
    </div>
  );
}
