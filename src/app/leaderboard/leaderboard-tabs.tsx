"use client";

import { useState, useRef, useEffect } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { Eye, Star, MessageSquare, Users } from "lucide-react";

const TAB_ITEMS = [
  { value: "most-viewed", label: "Most Viewed", Icon: Eye },
  { value: "top-rated", label: "Top Rated", Icon: Star },
  { value: "most-reviewed", label: "Most Reviewed", Icon: MessageSquare },
  { value: "most-active", label: "Most Active", Icon: Users },
] as const;

type TabValue = (typeof TAB_ITEMS)[number]["value"];

export function LeaderboardTabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabValue>("most-viewed");
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = TAB_ITEMS.findIndex((t) => t.value === activeTab);
    const trigger = triggerRefs.current[idx];
    const list = listRef.current;
    if (trigger && list) {
      const listRect = list.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      setPill({ left: triggerRect.left - listRect.left, width: triggerRect.width });
    }
  }, [activeTab]);

  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabValue)}
    >
      <TabsPrimitive.List
        ref={listRef}
        className="relative inline-flex w-full sm:w-auto flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1 h-auto"
      >
        {/* Animated sliding pill */}
        {pill && (
          <div
            aria-hidden
            className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm pointer-events-none"
            style={{
              left: pill.left,
              width: pill.width,
              transition: "left 0.32s cubic-bezier(0.34, 1.4, 0.64, 1), width 0.32s cubic-bezier(0.34, 1.4, 0.64, 1)",
            }}
          />
        )}

        {TAB_ITEMS.map(({ value, label, Icon }, idx) => (
          <TabsPrimitive.Tab
            key={value}
            value={value}
            ref={(el: HTMLButtonElement | null) => {
              triggerRefs.current[idx] = el;
            }}
            className="relative z-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-neutral-500 data-[active]:text-neutral-900 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>

      {children}
    </TabsPrimitive.Root>
  );
}

export { TabsContent };
