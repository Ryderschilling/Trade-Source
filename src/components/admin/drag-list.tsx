'use client';

import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragListItem {
  id: string;
}

interface DragListProps<T extends DragListItem> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function DragList<T extends DragListItem>({
  items: initialItems,
  onReorder,
  renderItem,
  className,
}: DragListProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleDragStart(i: number) {
    dragIndex.current = i;
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOver(i);
  }

  function handleDrop(i: number) {
    if (dragIndex.current === null || dragIndex.current === i) {
      setDragOver(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    setDragOver(null);
    setItems(next);
    onReorder(next);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  return (
    <ul className={cn('space-y-1', className)}>
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
          className={cn(
            'flex items-start gap-2 bg-white rounded-md border px-3 py-2 cursor-grab active:cursor-grabbing transition-colors',
            dragOver === i
              ? 'border-neutral-400 bg-neutral-50'
              : 'border-neutral-200'
          )}
        >
          <GripVertical className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">{renderItem(item, i)}</div>
        </li>
      ))}
    </ul>
  );
}
