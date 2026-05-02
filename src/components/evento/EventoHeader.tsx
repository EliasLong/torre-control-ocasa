import React from 'react';

interface EventoHeaderProps {
  diaEvento: string;
  avance: number;
  estado: string;
  targetBultos?: number;
}

export function EventoHeader({ diaEvento, avance, estado, targetBultos = 11213 }: EventoHeaderProps) {
  const textColorEstado = estado === 'Al Día' ? '#8fbf4c' : (estado === 'Atrasado' ? '#E53935' : '#1A1A1A');

  return (
    <header className="bg-white border border-[#E0E0E0] text-[#1A1A1A] p-4 rounded-xl flex items-center justify-between shadow-sm mb-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">HOT SALE - CYBER</h1>
          <p className="text-[#9CA3AF] text-sm">
            11-18 mayo · 8 días · Forecast: {targetBultos.toLocaleString('es-AR')} pedidos · Vista ejecutiva A4 horizontal
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E0E0E0] min-w-[120px]">
          <div className="text-[#9CA3AF] text-xs mb-1">Día evento</div>
          <div className="text-xl font-bold text-[#1A1A1A]">{diaEvento}/8</div>
        </div>
        <div className="bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E0E0E0] min-w-[120px]">
          <div className="text-[#9CA3AF] text-xs mb-1">Avance</div>
          <div className="text-xl font-bold text-[#1A1A1A]">{avance}%</div>
        </div>
        <div className="bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E0E0E0] min-w-[120px]">
          <div className="text-[#9CA3AF] text-xs mb-1">Estado</div>
          <div className="text-xl font-bold" style={{ color: textColorEstado }}>{estado}</div>
        </div>
      </div>
    </header>
  );
}
