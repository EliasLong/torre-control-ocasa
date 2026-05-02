'use client';

import React from 'react';

interface DayTabsProps {
  days: { id: string; label: string; date: string }[];
  activeDay: string;
  onSelect: (dayId: string) => void;
}

export function DayTabs({ days, activeDay, onSelect }: DayTabsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      {days.map((day) => {
        const isActive = day.id === activeDay;
        return (
          <button
            key={day.id}
            onClick={() => onSelect(day.id)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200"
            style={{
              backgroundColor: isActive ? '#111827' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--color-text-muted)',
              borderColor: isActive ? '#111827' : 'var(--color-border)',
            }}
          >
            {day.label} · {day.date}
          </button>
        );
      })}
    </div>
  );
}
