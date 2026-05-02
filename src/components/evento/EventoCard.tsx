'use client';

import React from 'react';

type AccentColor = 'green' | 'purple' | 'amber' | 'red' | 'cyan';

interface EventoCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: AccentColor;
  highlight?: boolean; // for the large red "12.068" style card
}

const ACCENT_COLORS: Record<AccentColor, string> = {
  green: '#8fbf4c',
  purple: '#7C3AED',
  amber: '#ffab40',
  red: '#E53935',
  cyan: '#0099A8',
};

export function EventoCard({ label, value, subtitle, accent = 'green', highlight = false }: EventoCardProps) {
  const color = ACCENT_COLORS[accent];

  return (
    <div
      className="bg-white flex flex-col justify-between p-3 min-w-0 overflow-hidden"
      style={{
        borderLeft: `4px solid ${color}`,
        borderRadius: '4px',
        border: '1px solid #E0E0E0',
        borderLeftColor: color,
        borderLeftWidth: '4px',
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ color: '#6B7280' }}
      >
        {label}
      </div>
      <div
        className="font-bold leading-tight"
        style={{
          fontSize: highlight ? '1.75rem' : '1.4rem',
          color: highlight ? color : '#1A1A1A',
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
