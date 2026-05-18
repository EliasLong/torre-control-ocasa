import React from 'react';

interface EventoHeaderProps {
  diaEvento: string;
  avance: number;
  estado: string;
  targetBultos?: number;
  bultosIngresados?: number | null;
  loadingPedidos?: boolean;
  pendientePreparo?: number | null;
}

export function EventoHeader({ diaEvento, avance, estado, targetBultos = 15888, bultosIngresados, loadingPedidos, pendientePreparo }: EventoHeaderProps) {
  return (
    <header className="bg-white border border-[#E0E0E0] text-[#1A1A1A] p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between shadow-sm mb-6 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight uppercase text-[#1A1A1A]">HOT SALE</h1>
          <p className="text-[#9CA3AF] text-sm">
            11-20 mayo · 10 días · Forecast: {targetBultos.toLocaleString('es-AR')} bultos 
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E0E0E0] min-w-[120px]">
          <div className="text-[#9CA3AF] text-xs mb-1">Día evento</div>
          <div className="text-xl font-bold text-[#1A1A1A]">{diaEvento}/10</div>
        </div>
        <div className="bg-[#EFF6FF] px-4 py-2 rounded-lg border border-[#BFDBFE] min-w-[140px]">
          <div className="text-[#3B82F6] text-xs mb-1 font-semibold">Bultos Pickeados</div>
          <div className="text-xl font-bold text-[#1D4ED8]">
            {loadingPedidos ? '…' : bultosIngresados != null ? bultosIngresados.toLocaleString('es-AR') : '—'}
          </div>
        </div>
        <div className="bg-[#FFF7ED] px-4 py-2 rounded-lg border border-[#FED7AA] min-w-[160px]">
          <div className="text-[#F97316] text-xs mb-1 font-semibold">Pendiente a preparar</div>
          <div className="text-xl font-bold text-[#C2410C]">
            {pendientePreparo != null ? pendientePreparo.toLocaleString('es-AR') : '—'}
          </div>
        </div>
        <div className="bg-[#F5F5F5] px-4 py-2 rounded-lg border border-[#E0E0E0] min-w-[120px]">
          <div className="text-[#9CA3AF] text-xs mb-1">Avance</div>
          <div className="text-xl font-bold text-[#1A1A1A]">{avance}%</div>
        </div>
      </div>
    </header>
  );
}
