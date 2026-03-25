import { formatCurrency } from '@/lib/calculations';

interface Row {
  servicio: string;
  volumen: number;
  tarifa: number;
  subtotal: number;
}

interface Props {
  rows: Row[];
}

export function FinancialBreakdownTable({ rows }: Props) {
  const total = rows.reduce((sum, r) => sum + r.subtotal, 0);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
          <th className="text-left py-2">Servicio</th>
          <th className="text-right py-2">Volumen</th>
          <th className="text-right py-2">Tarifa</th>
          <th className="text-right py-2">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr
            key={row.servicio}
            className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-surface)] transition-colors"
          >
            <td className="py-2.5 text-[var(--color-text-primary)]">{row.servicio}</td>
            <td className="py-2.5 text-right text-[var(--color-text-muted)]">
              {row.volumen.toLocaleString('es-AR')}
            </td>
            <td className="py-2.5 text-right text-[var(--color-text-muted)]">
              {formatCurrency(row.tarifa)}
            </td>
            <td className="py-2.5 text-right text-[var(--color-accent-cyan)] font-semibold">
              {formatCurrency(row.subtotal)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-[var(--color-border)] font-bold">
          <td className="py-3 text-[var(--color-text-primary)]">TOTAL</td>
          <td className="py-3" />
          <td className="py-3" />
          <td className="py-3 text-right text-[var(--color-accent-cyan)]">
            {formatCurrency(total)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
