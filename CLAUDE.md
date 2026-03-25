# CLAUDE.md — Dashboard Financiero

## Stack
- Framework: Next.js 14+ (App Router, TypeScript)
- UI/Charts: Tailwind CSS, Recharts, Lucide React
- Lógica/Data: SWR (fetch), Service Wrappers (Google Sheets, datos operativos via n8n)
- Versión Node: v20+

## Estructura
- `/src/app`: Rutas, Layouts y API Handlers (App Router)
- `/src/components`: Componentes visuales (unidos por `/layout`, `/charts`, `/kpi`, `/tables`)
- `/src/services`: Wrappers de datos (Sheets Service — datos operativos sincronizados por n8n)
- `/src/lib`: Lógica pura de cálculos financieros y utilidades
- `/src/types`: Definiciones de TypeScript
- `/docs/plans`: Documentación de diseño y planes de ejecución

## Módulos
- 📋 Configuración Inicial & Layout: pendiente
- 📋 Dashboard Operacional: pendiente
- 📋 Dashboard Financiero: pendiente
- 📋 Dashboard Merma: pendiente
- 📋 Dashboard ABC-XYZ: pendiente

## Variables de Entorno
- `GOOGLE_SHEETS_API_KEY`: API Key para Google Sheets
- `GOOGLE_SHEET_ID`: ID del documento de tarifas/costos/operaciones
- SQL Server: conectado via n8n workflow (no directamente desde la app)

## Comandos
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Reglas de Código
Estas reglas son obligatorias (basadas en "buenas-practicas.md"):
- **SoC:** UI es "tonta" (solo muestra), Lógica es "ciega" (no sabe cómo se muestra).
- **Inmutabilidad por defecto:** No mutar datos a menos que sea estrictamente necesario.
- **Early Return:** Verificar condiciones negativas/error primero; el camino feliz al final.
- **Chesterton's Fence:** Antes de borrar código existente, explicar POR QUÉ existía.
- **Tokens de diseño:** Usar variables semánticas (CSS variables/Tailwind); evitar magic numbers.
- **Atomicidad:** Cada cambio debe ser funcional; no dejar TODOs críticos que rompan la app.
- **Wrappers:** Usar interfaces para dependencias externas (Sheets) para facilitar cambios.

## Contexto de Negocio
Dashboard para OCASA enfocado en la visualización de la operación de warehouse de electrodomésticos. El objetivo es centralizar métricas de volumen (contenedores, pallets, picking), rentabilidad financiera (venta vs costo), control de merma y análisis de inventario (Matriz ABC-XYZ).

## Decisiones Técnicas
- **MVP Offline-First:** Se construye la Fase 1 con datos mock locales para validar UI rápidamente.
- **Server-Side Logic:** Los cálculos complejos y el formateo de datos ocurren en las API Routes para mantener el cliente liviano y seguro.
- **Heat-map Matrix:** La matriz ABC-XYZ utiliza una visualización de celdas con intensidad de color según volumen relativo.
