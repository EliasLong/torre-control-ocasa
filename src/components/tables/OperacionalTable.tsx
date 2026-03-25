'use client';

interface OperacionalTableRow {
  fecha: string;
  palletsOutTotal: number;
  palletsOutB2C: number;
  palletsOutB2B: number;
  picking: number;
  palletsIn: number;
  contenedores: number;
}

interface Props {
  rows: OperacionalTableRow[];
}

const COLUMNS = [
  { key: 'fecha', label: 'Fecha', align: 'left' },
  { key: 'palletsOutTotal', label: 'Pallets Out', align: 'right' },
  { key: 'palletsOutB2C', label: 'P.Out B2C', align: 'right' },
  { key: 'palletsOutB2B', label: 'P.Out B2B', align: 'right' },
  { key: 'picking', label: 'Picking', align: 'right' },
  { key: 'palletsIn', label: 'Pallets In', align: 'right' },
  { key: 'contenedores', label: 'Contenedores', align: 'right' },
] as const;

function sumColumn(rows: OperacionalTableRow[], key: keyof Omit<OperacionalTableRow, 'fecha'>): number {
  return rows.reduce((acc, row) => acc + row[key], 0);
}

export function OperacionalTable({ rows }: Props) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={`py-2 px-3 font-medium text-[var(--color-text-muted)] uppercase tracking-wide text-xs ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.fecha} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover,rgba(255,255,255,0.02))]">
              <td className="py-2 px-3 text-[var(--color-text-primary)]">{row.fecha}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-primary)] font-medium">{row.palletsOutTotal.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-secondary)]">{row.palletsOutB2C.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-secondary)]">{row.palletsOutB2B.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{row.picking.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{row.palletsIn.toLocaleString()}</td>
              <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{row.contenedores.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--color-border)] font-bold">
            <td className="py-2 px-3 text-[var(--color-text-primary)]">TOTAL</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{sumColumn(rows, 'palletsOutTotal').toLocaleString()}</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-secondary)]">{sumColumn(rows, 'palletsOutB2C').toLocaleString()}</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-secondary)]">{sumColumn(rows, 'palletsOutB2B').toLocaleString()}</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{sumColumn(rows, 'picking').toLocaleString()}</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{sumColumn(rows, 'palletsIn').toLocaleString()}</td>
            <td className="py-2 px-3 text-right text-[var(--color-text-primary)]">{sumColumn(rows, 'contenedores').toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
