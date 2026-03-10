# Dashboard Financiero — Design Document
**Fecha:** 2026-03-09
**Proyecto:** OCASA — Dashboard Financiero & Operacional
**Stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · Recharts

---

## Contexto

Dashboard web para visualizar la operación de un warehouse de electrodomésticos (OCASA). Reemplaza tableros de BI con una app propia. Incluye 4 módulos: operacional, financiero, merma y matriz ABC-XYZ.

## Estrategia MVP

**Fase 1 (MVP):** Toda la UI se construye con datos mock locales. La arquitectura de carpetas y servicios refleja desde el inicio la futura conexión real, pero los servicios retornan mocks.

**Fase 2:** Se reemplazan los mocks por conexiones reales a SQL (operacionales) y Google Sheets API (tarifas, costos, presupuesto).

---

## Arquitectura

```
UI (Next.js App Router pages + components)
         ↓
API Layer (Route Handlers /api/*)
         ↓
Data Services (wrappers por fuente)
   ↙               ↘
SQL Service       Sheets Service
(mock → real)     (mock → real)
```

- Todos los cálculos son **server-side** (API routes)
- El cliente solo recibe JSON listo para renderizar
- Cada servicio tiene una interfaz TypeScript que permite swapear mock ↔ real sin tocar la UI

---

## Módulos

### 1. Dashboard Operacional

**KPI Cards:**
- Contenedores ingresados (día / mes)
- Pallets IN / Pallets OUT
- Picking total
- % Cumplimiento capacidad de picking

**Gráfico:** Evolutivo diario (área/barra) con:
- Serie: Contenedores, Pallets IN, Pallets OUT, Picking
- Línea de capacidad máxima de picking (horizontal)
- Línea de objetivo presupuestado por proceso (del Sheet)

**Filtros:** Rango de fechas · Nave (PL2 / PL3)

---

### 2. Dashboard Financiero

**KPI Cards:**
- Venta del día ($)
- Costo del día ($)
- Rentabilidad diaria (%)

**Gráfico:** Evolutivo diario — Venta acumulada vs Costo acumulado vs Presupuesto

**Tabla:** Desglose de venta por proceso (contenedores, pallets in/out, picking) con tarifa y subtotal

**Cálculo:** `Venta = Σ(volumen_proceso × tarifa_proceso)` · `Rentabilidad = (Venta - Costo) / Venta`

**Filtros:** Rango de fechas · Nave

---

### 3. Merma

**KPI Cards:**
- Análisis ($)
- Calidad ($)
- Despachos ($M)
- Merma % total `vs objetivo < 0.005%`

**Gráficos:**
- Línea evolutiva mensual del Merma %
- Barras por categoría (Análisis / Calidad / Despachos)

**Filtros:** Mes · Nave

---

### 4. Matriz ABC-XYZ

**Vista 1 — Matriz cruzada:**
Tabla heat-map A / A+ / B / C / C- × X / Y / Z con totales por fila y columna

**Vista 2 — Listado SKUs:**
Tabla con columnas: SKU · Descripción · Stock Cant · Valorizado Stock · Cant Despacho · Despacho Valorizado · ABC · XYZ

**KPIs:** Suma Valor Stock ($) · Suma Cant Stock

**Filtros:** Nave (PL2 / PL3)

---

## Data Flow

```
Usuario selecciona filtros (fecha, nave)
        ↓
Next.js Page → fetch /api/[modulo]?params
        ↓
Route Handler:
  ├── SQL Service → datos de volúmenes / stock
  └── Sheets Service → tarifas, costos, objetivos
        ↓
Cálculo server-side
        ↓
JSON → componentes de gráficos y tablas
```

---

## Error Handling

- **Sin datos:** estado `Empty` con mensaje descriptivo por módulo
- **Source unreachable:** alerta visible al usuario + dato cacheado (SWR stale-while-revalidate)
- **Error de conexión:** error boundary a nivel de módulo, no colapsa los demás
- Nunca se silencia un error; siempre llega como estado visible o toast

---

## Estructura de Carpetas (tentativa)

```
dashboard-financiero/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Redirect a /operacional
│   │   ├── operacional/page.tsx
│   │   ├── financiero/page.tsx
│   │   ├── merma/page.tsx
│   │   ├── abc-xyz/page.tsx
│   │   └── api/
│   │       ├── operacional/route.ts
│   │       ├── financiero/route.ts
│   │       ├── merma/route.ts
│   │       └── abc-xyz/route.ts
│   ├── components/
│   │   ├── layout/   (Sidebar, Header)
│   │   ├── charts/   (LineChart, BarChart, HeatmapMatrix)
│   │   ├── kpi/      (KPICard)
│   │   └── tables/   (SKUTable, FinancialBreakdownTable)
│   ├── services/
│   │   ├── sql.service.ts      # wrapper SQL (mock en Fase 1)
│   │   └── sheets.service.ts   # wrapper Sheets API (mock en Fase 1)
│   ├── lib/
│   │   └── calculations.ts     # funciones puras: rentabilidad, merma %, etc.
│   └── types/
│       └── index.ts
├── docs/
│   └── plans/
│       └── 2026-03-09-dashboard-financiero-design.md
└── ...config files
```

---

## Testing

- **Unit:** funciones en `lib/calculations.ts` (merma %, rentabilidad, volumen × tarifa)
- **Integration (Fase 2):** API routes con datos reales de SQL + Sheets
- **Visual:** browser manual por módulo con datos mock en Fase 1

