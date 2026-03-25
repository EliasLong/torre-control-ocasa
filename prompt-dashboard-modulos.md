# Implementar módulos Dashboard Operacional y Dashboard Financiero

## Contexto del proyecto
Este es el proyecto `dashboard-financiero`, un dashboard Next.js 14 (App Router + TypeScript + Tailwind + Recharts) para OCASA. Las rutas `/operacional` y `/financiero` ya existen en `/src/app/`. Los componentes van en `/src/components/` (organizados en `charts/`, `filters/`, `kpi/`, `tables/`, `layout/`). La lógica de negocio va en `/src/lib/`. Los services (wrappers de datos) van en `/src/services/`. Los types en `/src/types/`.

Respetar las reglas del CLAUDE.md: SoC (UI tonta, lógica ciega), inmutabilidad, early return, wrappers para dependencias externas, server-side logic para cálculos.

## Fase 1: Mock data (implementar ahora)
Construir toda la UI con datos mock en `/src/lib/mock/` para validar rápido. Los services deben usar interfaces/wrappers para que en Fase 2 se reemplacen por las fuentes reales sin tocar la UI.

## Fase 2: Datos reales (posterior, solo dejar los wrappers preparados)
- Google Sheets API (`googleapis`) → pallets out y personal
- SQL Server (`mssql`) → picking, pallet in, contenedores
- Vercel Cron Job diario a las 23:00 hs ARG (02:00 UTC) → API Route `/api/sync`
- Supabase como capa intermedia de almacenamiento

---

## MÓDULO 1: Dashboard Operacional (`/src/app/operacional/`)

### Fuentes de datos y métricas

**Pallets Out** (fuente real: 2 Google Sheets)
- Sheet B2C: Hoja PL2 (fecha col A, pallets col F), Hoja PL3 (fecha col A, pallets col F)
- Sheet B2B: Hoja PL2 (fecha col A, pallets col K), Hoja PL3 (fecha col A, pallets col J)
- Dimensiones: tipo (B2C/B2B) y planta (PL2/PL3)

**Picking** (fuente real: SQL Server - tabla de movimientos)
- Filtro: subinventario = 'PORTONES' AND tipo_transaccion = 'Sales Order Pick'
- Métrica: SUM(cantidad_transaccion) agrupado por fecha

**Contenedores** (fuente real: SQL Server - tabla de movimientos)
- Filtro: tipo_transaccion IN ('Direct Org Transfer SIN REMITO', 'Direct Org Transfer')
- Métrica: COUNT(DISTINCT Lpn_Contenido) agrupado por fecha

**Pallet In** (fuente real: SQL Server - tabla de movimientos)
- Mismos filtros que contenedores
- Métrica: por cada FILA, aplicar conversión de cantidad_transaccion a pallets y sumar por fecha
- Tabla de conversión (por fila/artículo):

| Rango unidades | Divisor |
|----------------|---------|
| 1 - 50         | 2       |
| 51 - 100       | 3       |
| 101 - 200      | 4       |
| 201 - 300      | 6       |
| 301 - 400      | 8       |
| 401 - 500      | 12      |
| 501 - 600      | 14      |
| 601+           | 18      |

Función de conversión (poner en `/src/lib/calculations.ts`):
```typescript
export function calcularPalletsIn(cantidad: number): number {
  if (cantidad <= 50) return Math.ceil(cantidad / 2);
  if (cantidad <= 100) return Math.ceil(cantidad / 3);
  if (cantidad <= 200) return Math.ceil(cantidad / 4);
  if (cantidad <= 300) return Math.ceil(cantidad / 6);
  if (cantidad <= 400) return Math.ceil(cantidad / 8);
  if (cantidad <= 500) return Math.ceil(cantidad / 12);
  if (cantidad <= 600) return Math.ceil(cantidad / 14);
  return Math.ceil(cantidad / 18);
}
```

### UI del Dashboard Operacional

- **Selector de rango de fechas** (date picker from/to) → componente en `/src/components/filters/`
- **4 KPI cards** (usar `/src/components/kpi/`):
  - Total Pallets Out (con desglose B2C/B2B y PL2/PL3)
  - Total Picking
  - Total Pallets In
  - Total Contenedores
- **Gráfico de líneas** (usar `/src/components/charts/` con Recharts): evolución diaria de las 4 métricas
- **Tabla detallada** (usar `/src/components/tables/`): datos por día con todas las columnas

### Mock data para Fase 1

Crear en `/src/lib/mock/` datos mock que cubran al menos 30 días con:
- pallets_out: array de { fecha, pallets, tipo: 'B2C'|'B2B', planta: 'PL2'|'PL3' }
- operaciones: array de { fecha, picking, pallets_in, contenedores }

### Service wrapper

En `/src/services/` crear un wrapper tipo:
```typescript
interface OperationalDataService {
  getPalletsOut(desde: Date, hasta: Date): Promise<PalletOut[]>;
  getOperaciones(desde: Date, hasta: Date): Promise<OperacionDiaria[]>;
}
```
Fase 1: implementación mock. Fase 2: se reemplaza por Supabase client.

---

## MÓDULO 2: Dashboard Financiero (`/src/app/financiero/`)

### Lógica de negocio

**Facturación** = suma por período de:
- picking × tarifa_picking (vigente a la fecha)
- pallets_in × tarifa_pallet_in
- pallets_out_b2c × tarifa_pallet_out_b2c
- pallets_out_b2b × tarifa_pallet_out_b2b
- contenedores × tarifa_contenedor

**Costos fijos**: suma de todos los costos donde tipo = 'fijo' (prorrateados por día dentro del período)

**Costos variables**: para cada día del período, costo_variable × jornales de ese día
- Jornales vienen de la tabla personal_diario (fuente real: Google Sheet con columna fecha y columna jornales)

**Resultado** = Facturación total - (Costos fijos + Costos variables)

### Datos de referencia (tarifas y costos)

Las tarifas y costos se actualizan ~1 vez por mes. Tienen vigencia (desde/hasta).
- En Fase 1: mock data en `/src/lib/mock/`
- En Fase 2: tablas en Supabase con CRUD en `/admin`
- Ya existe la carpeta `Costos y Tarifas` en la raíz del proyecto — posiblemente tiene los Excel de referencia. Revisar su contenido para generar mock data realista.

### UI del Dashboard Financiero

- **Selector de rango de fechas**
- **KPI cards**:
  - Facturación total
  - Costos totales
  - Resultado (Facturación - Costos)
  - Margen % (Resultado / Facturación × 100)
- **Desglose de facturación**: card o tabla mostrando facturación por servicio (picking, pallet in, pallet out B2C, pallet out B2B, contenedores)
- **Desglose de costos**: fijos vs variables
- **Gráficos** (Recharts):
  - Barras apiladas: facturación por servicio
  - Líneas: facturación vs costos evolución diaria
  - Línea: resultado diario
- **Tabla detallada**: por día con facturación, costos fijos, costos variables, resultado

### Mock data para Fase 1

Crear en `/src/lib/mock/`:
- tarifas: array de { servicio, tarifa, vigencia_desde, vigencia_hasta }
- costos: array de { concepto, tipo: 'fijo'|'variable', monto, vigencia_desde, vigencia_hasta }
- personal_diario: array de { fecha, jornales }

### Service wrapper

```typescript
interface FinancialDataService {
  getTarifas(fecha: Date): Promise<Tarifa[]>;
  getCostos(fecha: Date): Promise<Costo[]>;
  getPersonalDiario(desde: Date, hasta: Date): Promise<PersonalDiario[]>;
}
```

Poner la lógica de cálculo financiero en `/src/lib/calculations.ts`:
```typescript
export function calcularFacturacion(operaciones, tarifas): FacturacionDetalle
export function calcularCostos(costosFijos, costosVariables, jornales): CostosDetalle
export function calcularResultado(facturacion, costos): ResultadoDetalle
```

---

## MÓDULO ADMIN: CRUD Tarifas y Costos

Si no existe `/src/app/admin/`, crearlo. Página simple con:
- Tabla editable de tarifas (servicio, monto, vigencia)
- Tabla editable de costos (concepto, tipo fijo/variable, monto, vigencia)
- En Fase 1 con mock data / localStorage
- En Fase 2 conectado a Supabase

---

## SYNC (solo preparar estructura, no implementar)

Crear `/src/app/api/sync/route.ts` con la estructura preparada pero comentada:
- Endpoint protegido con CRON_SECRET via header Authorization
- Placeholder para: sync sheets, sync SQL Server, sync personal
- Dejar el `vercel.json` preparado:
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Types

Definir en `/src/types/`:

```typescript
interface PalletOut {
  fecha: string; // ISO date
  pallets: number;
  tipo: 'B2C' | 'B2B';
  planta: 'PL2' | 'PL3';
}

interface OperacionDiaria {
  fecha: string;
  picking: number;
  pallets_in: number;
  contenedores: number;
}

interface PersonalDiario {
  fecha: string;
  jornales: number;
}

interface Tarifa {
  servicio: string;
  tarifa: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
}

interface Costo {
  concepto: string;
  tipo: 'fijo' | 'variable';
  monto: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
}
```

---

## Orden de implementación sugerido
1. Types en `/src/types/`
2. Mock data en `/src/lib/mock/`
3. Función `calcularPalletsIn` en `/src/lib/calculations.ts`
4. Service wrappers en `/src/services/`
5. Componentes reutilizables (date picker, KPI cards) en `/src/components/`
6. Dashboard Operacional UI (`/operacional`)
7. Funciones de cálculo financiero en `/src/lib/calculations.ts`
8. Dashboard Financiero UI (`/financiero`)
9. Admin CRUD (`/admin`)
10. Estructura del sync API route (placeholder)
