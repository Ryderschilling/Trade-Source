import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <Card className="border-neutral-200">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && (
              <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
            )}
          </div>
          <div className="p-2 bg-neutral-100 rounded-lg">
            <Icon className="w-4 h-4 text-neutral-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
