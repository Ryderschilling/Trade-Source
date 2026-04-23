'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: unknown;
  label?: string;
  defaultCollapsed?: boolean;
  className?: string;
}

export function JsonViewer({ data, label, defaultCollapsed = false, className }: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const formatted = (() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  })();

  return (
    <div className={cn('font-mono text-xs', className)}>
      {label && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700 mb-1"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span className="font-medium">{label}</span>
        </button>
      )}
      {!collapsed && (
        <pre className="bg-neutral-950 text-neutral-200 rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap break-all leading-5">
          {formatted}
        </pre>
      )}
    </div>
  );
}
