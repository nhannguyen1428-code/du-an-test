"use client";

import { MessageSquare, Users, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppTab = "lobby" | "dm" | "friends";

type BottomNavProps = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  dmBadge?: number;
  friendBadge?: number;
};

const items: { id: AppTab; label: string; icon: typeof Radio }[] = [
  { id: "lobby", label: "Phòng chung", icon: Radio },
  { id: "dm", label: "Tin riêng", icon: MessageSquare },
  { id: "friends", label: "Bạn bè", icon: Users },
];

export function BottomNav({ tab, onChange, dmBadge = 0, friendBadge = 0 }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-white/10 bg-panel pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-3xl">
        {items.map(({ id, label, icon: Icon }) => {
          const badge = id === "friends" ? friendBadge : id === "dm" ? dmBadge : 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition",
                tab === id ? "text-accent" : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {badge > 0 ? (
                <span className="absolute top-1 right-[calc(50%-1.25rem)] flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
