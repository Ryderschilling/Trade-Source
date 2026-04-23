'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write markdown…',
  minHeight = 200,
  className,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);

  // Minimal markdown → HTML for preview (paragraphs + bold + italic + links)
  function renderMarkdown(md: string): string {
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline text-blue-600">$1</a>')
      .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-lg mt-4 mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-1">$1</h1>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>')
      .replace(/^/, '<p class="mb-3">')
      .replace(/$/, '</p>');
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1 border-b border-neutral-200 pb-1">
        <Button
          type="button"
          size="sm"
          variant={preview ? 'outline' : 'default'}
          className="h-6 text-xs px-2"
          onClick={() => setPreview(false)}
        >
          Write
        </Button>
        <Button
          type="button"
          size="sm"
          variant={preview ? 'default' : 'outline'}
          className="h-6 text-xs px-2"
          onClick={() => setPreview(true)}
        >
          Preview
        </Button>
      </div>

      {preview ? (
        <div
          className="rounded-md border border-neutral-200 p-3 text-sm prose-sm"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm font-mono resize-y"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
