'use client';

import {
  type AbcCategory,
  type XyzCategory,
  type MatrixCell,
  ABC_ORDER,
  XYZ_ORDER,
} from '@/types/abcxyz.types';

interface Props {
  data: MatrixCell[];
  selectedCell?: { abc: AbcCategory; xyz: XyzCategory } | null;
  onCellClick: (abc: AbcCategory, xyz: XyzCategory) => void;
}

function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'text-[var(--color-text-muted)]';
  const ratio = count / max;
  if (ratio > 0.7) return 'bg-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]';
  if (ratio >= 0.3) return 'bg-[var(--color-accent-cyan)]/20';
  return 'bg-[var(--color-accent-cyan)]/10';
}

export function AbcXyzMatrix({ data, selectedCell, onCellClick }: Props) {
  const getCell = (abc: AbcCategory, xyz: XyzCategory): MatrixCell =>
    data.find((c) => c.abc === abc && c.xyz === xyz) ?? {
      abc,
      xyz,
      count: 0,
      totalStock: 0,
      totalValorizado: 0,
    };

  const maxCount = Math.max(...data.map((c) => c.count), 0);

  const rowTotal = (abc: AbcCategory): number =>
    XYZ_ORDER.reduce((sum, xyz) => sum + getCell(abc, xyz).count, 0);

  const colTotal = (xyz: XyzCategory): number =>
    ABC_ORDER.reduce((sum, abc) => sum + getCell(abc, xyz).count, 0);

  const grandTotal = ABC_ORDER.reduce((sum, abc) => sum + rowTotal(abc), 0);

  const isSelected = (abc: AbcCategory, xyz: XyzCategory): boolean =>
    selectedCell?.abc === abc && selectedCell?.xyz === xyz;

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
          <th className="text-left py-3 px-4">ABC \ XYZ</th>
          {XYZ_ORDER.map((xyz) => (
            <th key={xyz} className="text-center py-3 px-4">
              {xyz}
            </th>
          ))}
          <th className="text-center py-3 px-4 font-bold text-[var(--color-text-primary)]">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {ABC_ORDER.map((abc) => (
          <tr key={abc} className="border-b border-[var(--color-border)]/40">
            <td className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">
              {abc}
            </td>
            {XYZ_ORDER.map((xyz) => {
              const cell = getCell(abc, xyz);
              return (
                <td
                  key={xyz}
                  onClick={() => onCellClick(abc, xyz)}
                  className={[
                    'py-3 px-4 text-center font-medium rounded cursor-pointer transition-all',
                    heatColor(cell.count, maxCount),
                    isSelected(abc, xyz) ? 'ring-2 ring-[var(--color-accent-cyan)]' : '',
                  ].join(' ')}
                >
                  {cell.count}
                </td>
              );
            })}
            <td className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">
              {rowTotal(abc)}
            </td>
          </tr>
        ))}
        <tr className="border-t-2 border-[var(--color-border)] font-bold text-[var(--color-text-primary)]">
          <td className="py-3 px-4">Total</td>
          {XYZ_ORDER.map((xyz) => (
            <td key={xyz} className="py-3 px-4 text-center">
              {colTotal(xyz)}
            </td>
          ))}
          <td className="py-3 px-4 text-center">{grandTotal}</td>
        </tr>
      </tbody>
    </table>
  );
}
