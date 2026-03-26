'use client';

interface SubTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function SubTabs({ tabs, activeTab, onChange }: SubTabsProps) {
  return (
    <div className="relative">
      {/* Background track */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-accent-cyan)] text-white shadow-md shadow-[var(--color-accent-cyan)]/20'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
