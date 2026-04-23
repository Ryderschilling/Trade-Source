'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  baseHref: string;
}

export function TabBar({ tabs, activeTab, baseHref }: TabBarProps) {
  return (
    <div className="flex gap-0.5 border-b border-neutral-200 mb-5">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`${baseHref}?tab=${tab.id}`}
          className={cn(
            'px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.id
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
