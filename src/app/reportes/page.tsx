'use client';

import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportItem {
  sheet: string;
  label: string;
  description: string;
}

const REPORTS: ReportItem[] = [
  { sheet: 'operacional', label: 'Operacional', description: 'Movimientos diarios: picking, pallets in/out, contenedores' },
  { sheet: 'financiero', label: 'Financiero', description: 'Facturación, costos fijos/variables, resultado y margen diario' },
  { sheet: 'tarifas', label: 'Tarifas', description: 'Tarifas vigentes por servicio' },
  { sheet: 'costos', label: 'Costos', description: 'Estructura de costos fijos y variables' },
  { sheet: 'objetivos', label: 'Objetivos Mensuales', description: 'Objetivos de volumen por mes' },
  { sheet: 'merma', label: 'Merma', description: 'Registro de merma: SKU, cantidad, motivo y valor' },
  { sheet: 'torre_control', label: 'Torre de Control', description: 'Snapshot diario de operaciones warehouse' },
];

function handleDownload(sheet: string) {
  const url = `/api/export?sheet=${sheet}`;
  window.open(url, '_blank');
}

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet size={24} className="text-[var(--color-accent-cyan)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reportes</h1>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        Descargá los datos de cualquier módulo en formato CSV para análisis externo en Excel u otras herramientas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(({ sheet, label, description }) => (
          <div
            key={sheet}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
              </div>
              <FileSpreadsheet size={20} className="text-[var(--color-accent-green)] flex-shrink-0 mt-0.5" />
            </div>
            <button
              onClick={() => handleDownload(sheet)}
              className="flex items-center justify-center gap-2 w-full bg-[var(--color-accent-cyan)] text-white font-medium py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <Download size={14} />
              Descargar CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
