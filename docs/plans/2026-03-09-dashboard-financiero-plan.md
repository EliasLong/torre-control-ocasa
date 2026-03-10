# Dashboard Financiero — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-module financial and operational warehouse dashboard using Next.js with mock data (Phase 1 MVP), following the design in `docs/plans/2026-03-09-dashboard-financiero-design.md`.

**Architecture:** Next.js 14+ App Router with TypeScript and Tailwind CSS. Server-side API Route Handlers provide data from service wrappers (mock in Phase 1, real SQL + Sheets in Phase 2). UI components are purely presentational; all calculations live in `lib/calculations.ts`.

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · lucide-react · SWR

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `dashboard-financiero/` (project root, already exists)

**Step 1: Initialize Next.js project**

Run from `c:\Users\jcajaravilla\Desktop\Proyectos Antigravity\dashboard-financiero`:
```powershell
npx -y create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```
Expected: Next.js project scaffolded with TypeScript, Tailwind, App Router, and `src/` directory.

**Step 2: Install additional dependencies**
```powershell
npm install recharts swr lucide-react
npm install -D @types/node
```

**Step 3: Verify dev server starts**
```powershell
npm run dev
```
Expected: Server running at http://localhost:3000

**Step 4: Commit**
```powershell
git add .; git commit -m "feat: scaffold Next.js project with Tailwind and Recharts"
```

---

## Task 2: Design System & Layout

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/AppLayout.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Define design tokens in globals.css**

Replace default Tailwind base with CSS variables:
```css
:root {
  --color-bg-primary: #0F1117;
  --color-bg-surface: #1A1D27;
  --color-bg-card: #21253A;
  --color-accent-cyan: #00D4FF;
  --color-accent-green: #00E5A0;
  --color-accent-amber: #FFB547;
  --color-accent-red: #FF5C5C;
  --color-text-primary: #F0F4FF;
  --color-text-muted: #6B7280;
  --color-border: #2D3148;
}
body { background: var(--color-bg-primary); color: var(--color-text-primary); }
```

**Step 2: Create Sidebar with 4 navigation links**

`src/components/layout/Sidebar.tsx`:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, DollarSign, TrendingDown, Grid3X3 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/operacional', label: 'Operacional', icon: BarChart3 },
  { href: '/financiero', label: 'Financiero', icon: DollarSign },
  { href: '/merma', label: 'Merma', icon: TrendingDown },
  { href: '/abc-xyz', label: 'ABC-XYZ', icon: Grid3X3 },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 h-screen bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col p-4 gap-2">
      <div className="text-xl font-bold text-[var(--color-accent-cyan)] mb-6 px-3">OCASA</div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            pathname.startsWith(href)
              ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Icon size={18} />
          <span className="text-sm font-medium">{label}</span>
        </Link>
      ))}
    </aside>
  );
}
```

**Step 3: Create AppLayout wrapper**

`src/components/layout/AppLayout.tsx`:
```tsx
import { Sidebar } from './Sidebar';
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </div>
  );
}
```

**Step 4: Update root layout to use AppLayout + redirect `/` to `/operacional`**

`src/app/layout.tsx`: wrap `{children}` with `<AppLayout>`.

`src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/operacional'); }
```

**Step 5: Verify layout renders**
Open http://localhost:3000 — should redirect to /operacional, show sidebar with 4 links.

**Step 6: Commit**
```powershell
git add .; git commit -m "feat: add sidebar layout and design system tokens"
```

---

## Task 3: Shared Components (KPICard + Filters)

**Files:**
- Create: `src/components/kpi/KPICard.tsx`
- Create: `src/components/filters/DateRangeFilter.tsx`
- Create: `src/components/filters/NaveFilter.tsx`
- Create: `src/types/index.ts`

**Step 1: Define shared types**

`src/types/index.ts`:
```ts
export type Nave = 'PL2' | 'PL3' | 'todas';

export interface KPIData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}
```

**Step 2: Create KPICard component**

`src/components/kpi/KPICard.tsx`:
```tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData } from '@/types';

export function KPICard({ label, value, unit, trend, trendValue }: KPIData) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-[var(--color-accent-green)]' : trend === 'down' ? 'text-[var(--color-accent-red)]' : 'text-[var(--color-text-muted)]';
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-[var(--color-text-primary)]">{value}{unit && <span className="text-sm ml-1 text-[var(--color-text-muted)]">{unit}</span>}</span>
      {trend && <span className={`flex items-center gap-1 text-xs ${trendColor}`}><TrendIcon size={12}/>{trendValue}</span>}
    </div>
  );
}
```

**Step 3: Create NaveFilter**

`src/components/filters/NaveFilter.tsx`:
```tsx
'use client';
import { Nave } from '@/types';
interface Props { value: Nave; onChange: (v: Nave) => void; }
export function NaveFilter({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Nave)}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm"
    >
      <option value="todas">Todas las naves</option>
      <option value="PL2">PL2</option>
      <option value="PL3">PL3</option>
    </select>
  );
}
```

**Step 4: Commit**
```powershell
git add .; git commit -m "feat: add KPICard and filter components"
```

---

## Task 4: Mock Data & Service Layer

**Files:**
- Create: `src/lib/mock/operacional.mock.ts`
- Create: `src/lib/mock/financiero.mock.ts`
- Create: `src/lib/mock/merma.mock.ts`
- Create: `src/lib/mock/abcxyz.mock.ts`
- Create: `src/lib/calculations.ts`
- Create: `src/services/sql.service.ts`
- Create: `src/services/sheets.service.ts`

**Step 1: Create operacional mock data**

`src/lib/mock/operacional.mock.ts`:
```ts
export const operacionalMock = {
  kpis: {
    contenedoresHoy: 12,
    palletsIn: 148,
    palletsOut: 132,
    pickingTotal: 3210,
    cumplimientoCapacidad: 82, // %
  },
  evolutivo: [
    { fecha: '2026-03-01', contenedores: 10, palletsIn: 130, palletsOut: 120, picking: 2980, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-02', contenedores: 14, palletsIn: 155, palletsOut: 140, picking: 3400, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-03', contenedores: 8,  palletsIn: 100, palletsOut: 95,  picking: 2600, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-04', contenedores: 15, palletsIn: 170, palletsOut: 160, picking: 3800, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-05', contenedores: 11, palletsIn: 145, palletsOut: 130, picking: 3100, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-06', contenedores: 9,  palletsIn: 120, palletsOut: 110, picking: 2750, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-07', contenedores: 13, palletsIn: 152, palletsOut: 145, picking: 3300, capacidad: 3900, presupuesto: 3500 },
    { fecha: '2026-03-08', contenedores: 12, palletsIn: 148, palletsOut: 132, picking: 3210, capacidad: 3900, presupuesto: 3500 },
  ],
};
```

**Step 2: Create financiero mock data**

`src/lib/mock/financiero.mock.ts`:
```ts
export const financieroMock = {
  kpis: {
    ventaHoy: 4850000,
    costoHoy: 3200000,
    rentabilidadHoy: 34.0, // %
  },
  evolutivo: [
    { fecha: '2026-03-01', venta: 4200000, costo: 2900000, presupuesto: 4500000 },
    { fecha: '2026-03-02', venta: 5100000, costo: 3400000, presupuesto: 4500000 },
    { fecha: '2026-03-03', venta: 3800000, costo: 2700000, presupuesto: 4500000 },
    { fecha: '2026-03-04', venta: 5600000, costo: 3800000, presupuesto: 4500000 },
    { fecha: '2026-03-05', venta: 4700000, costo: 3100000, presupuesto: 4500000 },
    { fecha: '2026-03-06', venta: 4000000, costo: 2800000, presupuesto: 4500000 },
    { fecha: '2026-03-07', venta: 5000000, costo: 3300000, presupuesto: 4500000 },
    { fecha: '2026-03-08', venta: 4850000, costo: 3200000, presupuesto: 4500000 },
  ],
  desglose: [
    { proceso: 'Contenedores', volumen: 12, tarifa: 85000, subtotal: 1020000 },
    { proceso: 'Pallets IN', volumen: 148, tarifa: 8500, subtotal: 1258000 },
    { proceso: 'Pallets OUT', volumen: 132, tarifa: 9200, subtotal: 1214400 },
    { proceso: 'Picking', volumen: 3210, tarifa: 1110, subtotal: 3563100 },
  ],
};
```

**Step 3: Create merma mock data**

`src/lib/mock/merma.mock.ts`:
```ts
export const mermaMock = {
  kpis: {
    analisis: 2000000,
    calidad: 12000000,
    despachos: 7000000000, // $7 mil M
    mermaPorc: 0.000861,
    objetivo: 0.005,
  },
  evolutivo: [
    { mes: 'Ene', mermaPorc: 0.0009 },
    { mes: 'Feb', mermaPorc: 0.0007 },
    { mes: 'Mar', mermaPorc: 0.000861 },
  ],
  porCategoria: [
    { categoria: 'Análisis', monto: 2000000 },
    { categoria: 'Calidad', monto: 12000000 },
    { categoria: 'Despachos', monto: 7000000 },
  ],
};
```

**Step 4: Create ABC-XYZ mock data**

`src/lib/mock/abcxyz.mock.ts`:
```ts
export const abcxyzMock = {
  kpis: {
    valorStockTotal: 55000000000, // $55 mil M
    cantStockTotal: 314980,
  },
  matriz: {
    // rows: ABC category, cols: XYZ category
    data: [
      { abc: 'A',  x: 19, y: 14, z: 87  },
      { abc: 'A+', x: 1,  y: 1,  z: 4   },
      { abc: 'B',  x: 38, y: 14, z: 88  },
      { abc: 'C',  x: 22, y: 10, z: 47  },
      { abc: 'C-', x: 85, y: 21, z: 303 },
    ],
  },
  skus: [
    { sku: '9132LQ630BPSA', descripcion: 'Smart TV LG 32" Full HD AI ThinQ 32LQ630BPSA', stockCant: 6, valorizadoStock: 1488290, cantDespacho: 0, despachoValorizado: 0, abc: 'C-', xyz: 'Z' },
    { sku: '9143A42K', descripcion: 'TV 43" Hisense FHD A42K', stockCant: 1564, valorizadoStock: 372167970, cantDespacho: 0, despachoValorizado: 0, abc: 'A', xyz: 'Z' },
    { sku: '9143UR8750PSA', descripcion: 'Smart TV LG 43" Ultra HD AI ThinQ 43UR8750PSA', stockCant: 783, valorizadoStock: 296114480, cantDespacho: 70, despachoValorizado: 26446348, abc: 'A', xyz: 'Z' },
    { sku: '9150A64N', descripcion: 'TV Hisense 50" UHD 4K A6N', stockCant: 1208, valorizadoStock: 401354670, cantDespacho: 18, despachoValorizado: 5974995, abc: 'A', xyz: 'Z' },
    { sku: '9150C350NS', descripcion: 'Smart 50" Toshiba - VIDAA', stockCant: 2021, valorizadoStock: 679735636, cantDespacho: 53, despachoValorizado: 18402697, abc: 'A', xyz: 'Z' },
  ],
};
```

**Step 5: Create calculations.ts with pure functions**

`src/lib/calculations.ts`:
```ts
export function calcularRentabilidad(venta: number, costo: number): number {
  if (venta === 0) return 0;
  return ((venta - costo) / venta) * 100;
}

export function calcularMermaPorc(montoMerma: number, totalDespachos: number): number {
  if (totalDespachos === 0) return 0;
  return montoMerma / totalDespachos;
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)} Mil M`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)} M`;
  return `$${value.toLocaleString('es-AR')}`;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
```

**Step 6: Create service wrappers (mock in Phase 1)**

`src/services/sql.service.ts`:
```ts
// Phase 1: returns mock data. Phase 2: replace with real SQL queries.
import { operacionalMock } from '@/lib/mock/operacional.mock';
import { mermaMock } from '@/lib/mock/merma.mock';
import { abcxyzMock } from '@/lib/mock/abcxyz.mock';

export const sqlService = {
  getOperacionalData: async () => operacionalMock,
  getMermaData: async () => mermaMock,
  getAbcXyzData: async () => abcxyzMock,
};
```

`src/services/sheets.service.ts`:
```ts
// Phase 1: returns mock data. Phase 2: replace with Google Sheets API v4.
import { financieroMock } from '@/lib/mock/financiero.mock';

export const sheetsService = {
  getFinancieroData: async () => financieroMock,
};
```

**Step 7: Commit**
```powershell
git add .; git commit -m "feat: add mock data layer and service wrappers"
```

---

## Task 5: API Route Handlers

**Files:**
- Create: `src/app/api/operacional/route.ts`
- Create: `src/app/api/financiero/route.ts`
- Create: `src/app/api/merma/route.ts`
- Create: `src/app/api/abc-xyz/route.ts`

**Step 1: Create operacional route**

`src/app/api/operacional/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { sqlService } from '@/services/sql.service';

export async function GET() {
  try {
    const data = await sqlService.getOperacionalData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching operacional data' }, { status: 500 });
  }
}
```

Repeat the same pattern for:
- `src/app/api/financiero/route.ts` → `sheetsService.getFinancieroData()`
- `src/app/api/merma/route.ts` → `sqlService.getMermaData()`
- `src/app/api/abc-xyz/route.ts` → `sqlService.getAbcXyzData()`

**Step 2: Verify routes respond**

With dev server running, open in browser:
- http://localhost:3000/api/operacional → should return JSON with kpis and evolutivo
- http://localhost:3000/api/financiero → should return JSON with kpis, evolutivo, desglose
- http://localhost:3000/api/merma → should return JSON with kpis and evolutivo
- http://localhost:3000/api/abc-xyz → should return JSON with matriz and skus

**Step 3: Commit**
```powershell
git add .; git commit -m "feat: add API route handlers for all 4 modules"
```

---

## Task 6: Dashboard Operacional Page

**Files:**
- Create: `src/app/operacional/page.tsx`
- Create: `src/components/charts/OperacionalChart.tsx`

**Step 1: Create OperacionalChart**

`src/components/charts/OperacionalChart.tsx`:
```tsx
'use client';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DataPoint {
  fecha: string; contenedores: number; palletsIn: number;
  palletsOut: number; picking: number; capacidad: number; presupuesto: number;
}
interface Props { data: DataPoint[]; }

export function OperacionalChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="fecha" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
        <Legend />
        <Bar dataKey="palletsIn" name="Pallets IN" fill="#00D4FF" opacity={0.8} />
        <Bar dataKey="palletsOut" name="Pallets OUT" fill="#00E5A0" opacity={0.8} />
        <Bar dataKey="picking" name="Picking" fill="#FFB547" opacity={0.8} />
        <Line type="monotone" dataKey="capacidad" name="Capacidad" stroke="#FF5C5C" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <Line type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#A78BFA" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create Operacional page**

`src/app/operacional/page.tsx`:
```tsx
import { KPICard } from '@/components/kpi/KPICard';
import { OperacionalChart } from '@/components/charts/OperacionalChart';
import { sqlService } from '@/services/sql.service';

export default async function OperacionalPage() {
  const data = await sqlService.getOperacionalData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard Operacional</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Contenedores Hoy" value={data.kpis.contenedoresHoy} />
        <KPICard label="Pallets IN" value={data.kpis.palletsIn} />
        <KPICard label="Pallets OUT" value={data.kpis.palletsOut} />
        <KPICard label="% Capacidad Picking" value={`${data.kpis.cumplimientoCapacidad}%`} trend="up" trendValue="vs ayer" />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Evolutivo Diario</h2>
        <OperacionalChart data={data.evolutivo} />
      </div>
    </div>
  );
}
```

**Step 3: Verify**
Open http://localhost:3000/operacional — should show 4 KPI cards and a composite chart with bars and reference lines.

**Step 4: Commit**
```powershell
git add .; git commit -m "feat: add Dashboard Operacional page with KPIs and chart"
```

---

## Task 7: Dashboard Financiero Page

**Files:**
- Create: `src/app/financiero/page.tsx`
- Create: `src/components/charts/FinancieroChart.tsx`
- Create: `src/components/tables/FinancialBreakdownTable.tsx`

**Step 1: Create FinancieroChart (area + line)**

`src/components/charts/FinancieroChart.tsx`:
```tsx
'use client';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint { fecha: string; venta: number; costo: number; presupuesto: number; }
interface Props { data: DataPoint[]; }

export function FinancieroChart({ data }: Props) {
  const formatter = (v: number) => `$${(v/1_000_000).toFixed(1)}M`;
  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="fecha" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <YAxis tickFormatter={formatter} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <Tooltip formatter={formatter} contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
        <Legend />
        <Area type="monotone" dataKey="venta" name="Venta" fill="#00D4FF" stroke="#00D4FF" fillOpacity={0.15} />
        <Area type="monotone" dataKey="costo" name="Costo" fill="#FF5C5C" stroke="#FF5C5C" fillOpacity={0.15} />
        <Line type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create FinancialBreakdownTable**

`src/components/tables/FinancialBreakdownTable.tsx`:
```tsx
import { formatCurrency } from '@/lib/calculations';
interface Row { proceso: string; volumen: number; tarifa: number; subtotal: number; }
interface Props { rows: Row[]; }
export function FinancialBreakdownTable({ rows }: Props) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
          <th className="text-left py-2">Proceso</th>
          <th className="text-right py-2">Volumen</th>
          <th className="text-right py-2">Tarifa</th>
          <th className="text-right py-2">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.proceso} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-surface)] transition-colors">
            <td className="py-2.5 text-[var(--color-text-primary)]">{row.proceso}</td>
            <td className="py-2.5 text-right text-[var(--color-text-muted)]">{row.volumen.toLocaleString('es-AR')}</td>
            <td className="py-2.5 text-right text-[var(--color-text-muted)]">{formatCurrency(row.tarifa)}</td>
            <td className="py-2.5 text-right text-[var(--color-accent-cyan)] font-semibold">{formatCurrency(row.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Step 3: Create Financiero page**

`src/app/financiero/page.tsx`:
```tsx
import { KPICard } from '@/components/kpi/KPICard';
import { FinancieroChart } from '@/components/charts/FinancieroChart';
import { FinancialBreakdownTable } from '@/components/tables/FinancialBreakdownTable';
import { sheetsService } from '@/services/sheets.service';
import { formatCurrency, formatPercent } from '@/lib/calculations';

export default async function FinancieroPage() {
  const data = await sheetsService.getFinancieroData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Venta Hoy" value={formatCurrency(data.kpis.ventaHoy)} trend="up" trendValue="vs ayer" />
        <KPICard label="Costo Hoy" value={formatCurrency(data.kpis.costoHoy)} trend="down" trendValue="vs ayer" />
        <KPICard label="Rentabilidad" value={formatPercent(data.kpis.rentabilidadHoy)} trend="up" trendValue="vs ayer" />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Evolutivo Financiero</h2>
        <FinancieroChart data={data.evolutivo} />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Desglose por Proceso</h2>
        <FinancialBreakdownTable rows={data.desglose} />
      </div>
    </div>
  );
}
```

**Step 4: Verify**
Open http://localhost:3000/financiero — should show 3 KPI cards, area chart, and breakdown table.

**Step 5: Commit**
```powershell
git add .; git commit -m "feat: add Dashboard Financiero page with chart and breakdown table"
```

---

## Task 8: Merma Page

**Files:**
- Create: `src/app/merma/page.tsx`
- Create: `src/components/charts/MermaChart.tsx`

**Step 1: Create MermaChart (line + bar)**

`src/components/charts/MermaChart.tsx`:
```tsx
'use client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';

interface EvolItem { mes: string; mermaPorc: number; }
interface CatItem { categoria: string; monto: number; }
interface Props { evolutivo: EvolItem[]; porCategoria: CatItem[]; objetivo: number; }

export function MermaChart({ evolutivo, porCategoria, objetivo }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm text-[var(--color-text-muted)] mb-3">Merma % por Mes</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolutivo}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="mes" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={objetivo} stroke="var(--color-accent-red)" strokeDasharray="4 4" label={{ value: `Obj: ${objetivo}%`, fill: 'var(--color-accent-red)', fontSize: 10 }} />
            <Line type="monotone" dataKey="mermaPorc" name="Merma %" stroke="var(--color-accent-cyan)" strokeWidth={2} dot={{ fill: 'var(--color-accent-cyan)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm text-[var(--color-text-muted)] mb-3">Merma por Categoría ($)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={porCategoria} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `$${(v/1_000_000).toFixed(0)}M`} />
            <YAxis type="category" dataKey="categoria" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `$${(v/1_000_000).toFixed(1)}M`} />
            <Bar dataKey="monto" name="Monto" fill="var(--color-accent-amber)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Step 2: Create Merma page**

`src/app/merma/page.tsx`:
```tsx
import { KPICard } from '@/components/kpi/KPICard';
import { MermaChart } from '@/components/charts/MermaChart';
import { sqlService } from '@/services/sql.service';
import { formatCurrency } from '@/lib/calculations';

export default async function MermaPage() {
  const data = await sqlService.getMermaData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Merma</h1>
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Análisis" value={formatCurrency(data.kpis.analisis)} />
        <KPICard label="Calidad" value={formatCurrency(data.kpis.calidad)} />
        <KPICard label="Despachos" value={formatCurrency(data.kpis.despachos)} />
        <KPICard label="Merma %" value={data.kpis.mermaPorc.toFixed(6)} unit="%" trend={data.kpis.mermaPorc < data.kpis.objetivo ? 'up' : 'down'} trendValue={`Obj < ${data.kpis.objetivo}%`} />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <MermaChart evolutivo={data.evolutivo} porCategoria={data.porCategoria} objetivo={data.kpis.objetivo} />
      </div>
    </div>
  );
}
```

**Step 3: Verify**
Open http://localhost:3000/merma — 4 KPI cards, line chart with objetivo reference line, horizontal bar chart.

**Step 4: Commit**
```powershell
git add .; git commit -m "feat: add Merma page with KPIs and dual charts"
```

---

## Task 9: ABC-XYZ Page

**Files:**
- Create: `src/app/abc-xyz/page.tsx`
- Create: `src/components/tables/AbcXyzMatrix.tsx`
- Create: `src/components/tables/SkuTable.tsx`

**Step 1: Create AbcXyzMatrix heat-map table**

`src/components/tables/AbcXyzMatrix.tsx`:
```tsx
interface MatrixRow { abc: string; x: number; y: number; z: number; }
interface Props { data: MatrixRow[]; }

const HEAT_COLOR = (value: number, max: number): string => {
  const intensity = Math.min(value / max, 1);
  if (intensity > 0.7) return 'bg-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]';
  if (intensity > 0.4) return 'bg-[var(--color-accent-cyan)]/15 text-[var(--color-text-primary)]';
  return 'text-[var(--color-text-muted)]';
};

export function AbcXyzMatrix({ data }: Props) {
  const allValues = data.flatMap(r => [r.x, r.y, r.z]);
  const max = Math.max(...allValues);
  const totals = { x: data.reduce((a, r) => a + r.x, 0), y: data.reduce((a, r) => a + r.y, 0), z: data.reduce((a, r) => a + r.z, 0) };
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
          <th className="text-left py-3 px-4">ABC \\ XYZ</th>
          <th className="text-center py-3 px-4">X</th>
          <th className="text-center py-3 px-4">Y</th>
          <th className="text-center py-3 px-4">Z</th>
          <th className="text-center py-3 px-4 font-bold text-[var(--color-text-primary)]">Total</th>
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.abc} className="border-b border-[var(--color-border)]/40">
            <td className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">{row.abc}</td>
            {(['x', 'y', 'z'] as const).map(col => (
              <td key={col} className={`py-3 px-4 text-center font-medium rounded ${HEAT_COLOR(row[col], max)}`}>{row[col]}</td>
            ))}
            <td className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">{row.x + row.y + row.z}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-[var(--color-border)] font-bold text-[var(--color-text-primary)]">
          <td className="py-3 px-4">Total</td>
          <td className="py-3 px-4 text-center">{totals.x}</td>
          <td className="py-3 px-4 text-center">{totals.y}</td>
          <td className="py-3 px-4 text-center">{totals.z}</td>
          <td className="py-3 px-4 text-center">{totals.x + totals.y + totals.z}</td>
        </tr>
      </tbody>
    </table>
  );
}
```

**Step 2: Create SkuTable**

`src/components/tables/SkuTable.tsx`:
```tsx
import { formatCurrency } from '@/lib/calculations';
interface Sku { sku: string; descripcion: string; stockCant: number; valorizadoStock: number; cantDespacho: number; despachoValorizado: number; abc: string; xyz: string; }
interface Props { skus: Sku[]; }
export function SkuTable({ skus }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            {['SKU','Descripción','Stock Cant','Val. Stock','Cant Despacho','Desp. Valorizado','ABC','XYZ'].map(h => (
              <th key={h} className="text-left py-2 px-2 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skus.map(s => (
            <tr key={s.sku} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg-surface)] transition-colors">
              <td className="py-2 px-2 font-mono text-[var(--color-accent-cyan)]">{s.sku}</td>
              <td className="py-2 px-2 text-[var(--color-text-muted)] max-w-xs truncate">{s.descripcion}</td>
              <td className="py-2 px-2 text-right">{s.stockCant.toLocaleString('es-AR')}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(s.valorizadoStock)}</td>
              <td className="py-2 px-2 text-right">{s.cantDespacho.toLocaleString('es-AR')}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(s.despachoValorizado)}</td>
              <td className="py-2 px-2 text-center font-bold text-[var(--color-accent-green)]">{s.abc}</td>
              <td className="py-2 px-2 text-center font-bold text-[var(--color-accent-amber)]">{s.xyz}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Create ABC-XYZ page**

`src/app/abc-xyz/page.tsx`:
```tsx
import { KPICard } from '@/components/kpi/KPICard';
import { AbcXyzMatrix } from '@/components/tables/AbcXyzMatrix';
import { SkuTable } from '@/components/tables/SkuTable';
import { sqlService } from '@/services/sql.service';
import { formatCurrency } from '@/lib/calculations';

export default async function AbcXyzPage() {
  const data = await sqlService.getAbcXyzData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Matriz ABC-XYZ</h1>
      <div className="grid grid-cols-2 gap-4">
        <KPICard label="Valor Stock Total" value={formatCurrency(data.kpis.valorStockTotal)} />
        <KPICard label="Cant. Stock Total" value={data.kpis.cantStockTotal.toLocaleString('es-AR')} unit="unidades" />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Matriz Cruzada</h2>
        <AbcXyzMatrix data={data.matriz.data} />
      </div>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Listado de SKUs</h2>
        <SkuTable skus={data.skus} />
      </div>
    </div>
  );
}
```

**Step 4: Verify**
Open http://localhost:3000/abc-xyz — 2 KPI cards, heat-map matrix table with totals, SKU list table.

**Step 5: Commit**
```powershell
git add .; git commit -m "feat: add ABC-XYZ page with matrix heatmap and SKU table"
```

---

## Task 10: Final Polish & Verification

**Files:**
- Modify: `src/app/operacional/page.tsx` (loading states)
- Create: `src/components/ui/LoadingSpinner.tsx`
- Create: `src/components/ui/ErrorBoundary.tsx`
- Modify: `src/app/layout.tsx` (page title)

**Step 1: Add loading.tsx files for each route (Next.js Suspense)**

Create `src/app/operacional/loading.tsx`, `src/app/financiero/loading.tsx`, `src/app/merma/loading.tsx`, `src/app/abc-xyz/loading.tsx`:
```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-accent-cyan)] border-t-transparent" />
    </div>
  );
}
```

**Step 2: Final end-to-end browser verification**

With `npm run dev` running, check each route:
1. http://localhost:3000 → redirects to /operacional ✅
2. http://localhost:3000/operacional → KPIs + chart ✅
3. http://localhost:3000/financiero → KPIs + area chart + table ✅
4. http://localhost:3000/merma → KPIs + line + bar chart ✅
5. http://localhost:3000/abc-xyz → KPIs + matrix + SKU table ✅

Sidebar links all navigate correctly ✅

**Step 3: Final commit**
```powershell
git add .; git commit -m "feat: add loading states and complete MVP dashboard"
```

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| Dev server starts | `npm run dev` | http://localhost:3000 accessible |
| API routes return data | Open each `/api/*` in browser | Valid JSON response |
| All 4 pages render | Navigate via sidebar | No errors, data visible |
| TypeScript compiles | `npm run build` | No type errors |
| Lint passes | `npm run lint` | No lint errors |
