import { formatCurrency } from '@/lib/calculations';
import { FacturacionDetalle, CostosDetalle } from '@/types';

interface DailyRow {
  fecha: string;
  facturacion: FacturacionDetalle;
  costos: CostosDetalle;
  resultado: number;
}

interface Props {
  data: DailyRow[];
}

export function FinancieroDailyTable({ data }: Props) {
  const totals = data.reduce(
    (acc, row) => ({
      facturacion: acc.facturacion + row.facturacion.total,
      costosFijos: acc.costosFijos + row.costos.fijos,
      costosVariables: acc.costosVariables + row.costos.variables,
      costosTotal: acc.costosTotal + row.costos.total,
      resultado: acc.resultado + row.resultado,
    }),
    { facturacion: 0, costosFijos: 0, costosVariables: 0, costosTotal: 0, resultado: 0 }
  );

  const resultadoColor = (value: number) =>
    value >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="text-left py-2">Fecha</th>
            <th className="text-right py-2">Facturación</th>
            <th className="text-right py-2">Costos Fijos</th>
            <th className="text-right py-2">Costos Variables</th>
            <th className="text-right py-2">Costos Total</th>
            <th className="text-right py-2">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={row.fecha}
              className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-surface)] transition-colors"
            >
              <td className="py-2.5 text-[var(--color-text-primary)]">{row.fecha}</td>
              <td className="py-2.5 text-right text-[var(--color-accent-cyan)]">
                {formatCurrency(row.facturacion.total)}
              </td>
              <td className="py-2.5 text-right text-[var(--color-text-muted)]">
                {formatCurrency(row.costos.fijos)}
              </td>
              <td className="py-2.5 text-right text-[var(--color-text-muted)]">
                {formatCurrency(row.costos.variables)}
              </td>
              <td className="py-2.5 text-right text-[var(--color-accent-red)]">
                {formatCurrency(row.costos.total)}
              </td>
              <td className={`py-2.5 text-right font-semibold ${resultadoColor(row.resultado)}`}>
                {formatCurrency(row.resultado)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--color-border)] font-bold">
            <td className="py-3 text-[var(--color-text-primary)]">TOTAL</td>
            <td className="py-3 text-right text-[var(--color-accent-cyan)]">
              {formatCurrency(totals.facturacion)}
            </td>
            <td className="py-3 text-right text-[var(--color-text-muted)]">
              {formatCurrency(totals.costosFijos)}
            </td>
            <td className="py-3 text-right text-[var(--color-text-muted)]">
              {formatCurrency(totals.costosVariables)}
            </td>
            <td className="py-3 text-right text-[var(--color-accent-red)]">
              {formatCurrency(totals.costosTotal)}
            </td>
            <td className={`py-3 text-right font-bold ${resultadoColor(totals.resultado)}`}>
              {formatCurrency(totals.resultado)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
