# ABC-XYZ Matrix Redesign — Implementation Plan

## Goal
Replace mock data with real Excel data, implement full ABC-XYZ classification engine (A+/A/B/C/C- x X/X-/Y/Z+/Z), and make the matrix interactive (click cell -> see SKUs).

## Data Sources
- `Bases Matriz/Movimientos.xlsx` — 11,163 movements (Feb 4-28 2026)
- `Bases Matriz/Mapa PL2 Febrero/` — 2 snapshots (inicio/fin Feb)
- `Bases Matriz/Mapa PL3 Febrero/` — 2 snapshots (inicio/fin Feb)

## Classification Thresholds
**ABC** (cumulative % of dispatched value): A+ <=15%, A <=80%, B <=95%, C <=98%, C- >98%
**XYZ** (days with movement / total business days): X >=0.50, X- >=0.35, Y >=0.20, Z+ >=0.10, Z <0.10

## Tasks

| # | Task | Files | Depends On | Parallel Group |
|---|------|-------|------------|----------------|
| 1 | Install xlsx formally | package.json | - | 1 |
| 2 | Define types | types/abcxyz.types.ts | - | 1 |
| 3 | Excel reader | lib/excel-reader.ts | 1,2 | 2 |
| 4 | Classification engine | lib/abcxyz-engine.ts | 2 | 2 |
| 7 | Interactive matrix component | components/tables/AbcXyzMatrix.tsx | 2 | 2 |
| 8 | Updated SKU table | components/tables/SkuTable.tsx | 2 | 2 |
| 5 | ABC-XYZ service | services/abcxyz.service.ts | 3,4 | 3 |
| 6 | API route update | app/api/abc-xyz/route.ts | 5 | 3 |
| 9 | Interactive page | app/abc-xyz/ | 6,7,8 | 4 |
| 10 | Verification | - | 9 | 5 |
