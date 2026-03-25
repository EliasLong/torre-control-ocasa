# Analisis del Tablero Power BI: "Tablero Ops Diario Newsan Pilar"

> Extraido automaticamente desde `Tablero Ops Diario Newsan Pilar.pbix` usando Power BI MCP Server.
> Fecha de analisis: 2026-03-25

---

## 1. Informacion general

| Campo | Valor |
|-------|-------|
| Archivo | `Tablero Ops Diario Newsan Pilar.pbix` |
| Tamano | 5.10 MB |
| Paginas | 9 |
| Visuales totales | 133 |
| Tablas del modelo | 6 |
| Medidas | 10 |
| Data sources embebidos | Ninguno (conexion live a dataset publicado) |
| Tema visual | `Template_OCASA.json` (personalizado) |

---

## 2. Estructura de paginas

### 2.0 Portada (3 visuales)

- **Tipo:** Pagina decorativa de bienvenida
- **Componentes:** 3 textbox (titulo, subtitulo, decoracion)
- **Imagen de fondo:** `Portada.png`

### 2.1 Contenidos (25 visuales)

- **Tipo:** Menu de navegacion / indice interactivo
- **Componentes:** 3 imagenes, 15 textbox, 7 shapes (usados como botones de navegacion)
- **Funcion:** Permite navegar a cada pagina operativa del tablero

### 2.2 Picking (19 visuales)

- **Tipo:** Pagina operativa
- **KPI Cards (4):**
  - Sum(Cantidad Transaccion)
  - Sum(Cantidad absoluta)
  - Bultos por Hora Promedio
  - Min(Fecha De Transaccion)
- **Filtros/Slicers (6):**
  - AGRUP_FAMILIA (familia de productos)
  - Fecha De Transaccion (rango de fechas)
  - Otros filtros contextuales
- **Graficos:** 1 Donut Chart (distribucion por familia/categoria)
- **Tablas:** 1 tableEx (detalle de operaciones de picking)
- **Otros:** 3 imagenes (header/logo), 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.3 Movimientos (14 visuales)

- **Tipo:** Pagina operativa
- **KPI Cards (2):**
  - Sum(Cantidad absoluta)
  - Sum(Cantidad Transaccion)
- **Filtros/Slicers (4):**
  - AGRUP_FAMILIA
  - Fecha De Transaccion
  - Otros filtros contextuales
- **Graficos:** 1 Bar Chart (movimientos por categoria/periodo)
- **Tablas:** 1 tableEx (detalle de movimientos)
- **Otros:** 2 imagenes, 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.4 Recepcion (15 visuales)

- **Tipo:** Pagina operativa
- **KPI Cards (3):**
  - Sum(Cantidad Transaccion)
  - Min(Lpn Contenido) (identificador de contenedor)
  - Min(Fecha De Transaccion)
- **Filtros/Slicers (5):**
  - AGRUP_FAMILIA
  - Fecha De Transaccion
  - Otros filtros contextuales
- **Tablas:** 1 tableEx (detalle de recepciones)
- **Otros:** 2 imagenes, 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.5 RMAs (14 visuales)

- **Tipo:** Pagina operativa (devoluciones / Return Merchandise Authorization)
- **KPI Cards (4):**
  - Sum(Cantidad Transaccion)
  - Sum(Costo Total Transaccion)
  - Min(Fecha De Transaccion)
  - (4to KPI contextual)
- **Filtros/Slicers (3):**
  - AGRUP_FAMILIA
  - Fecha De Transaccion
  - Otro filtro contextual
- **Tablas:** 1 tableEx (detalle de RMAs)
- **Otros:** 2 imagenes, 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.6 Pasajes a segunda (13 visuales)

- **Tipo:** Pagina operativa (pasajes de mercaderia a segunda seleccion)
- **KPI Cards (3):**
  - Sum(Cantidad absoluta)
  - Sum(Costo Total Transaccion)
  - Min(Fecha De Transaccion)
- **Filtros/Slicers (3):**
  - AGRUP_FAMILIA
  - Fecha De Transaccion
  - Otro filtro contextual
- **Tablas:** 1 tableEx (detalle de pasajes)
- **Otros:** 2 imagenes, 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.7 Portones (15 visuales)

- **Tipo:** Pagina operativa (gestion de portones / docks)
- **KPI Cards (3):**
  - Sum(Mapa PL2.Total)
  - Sum(Mapa PL3.Total)
  - Min(Fecha De Transaccion)
- **Filtros especiales:**
  - 2 Text Filters (busqueda de texto libre para codigos)
  - Codigo Mapa PL2
  - Codigo Mapa PL3
- **Tablas:** 2 tableEx (una por planta PL2 y PL3)
- **Otros:** 2 imagenes, 1 shape, 3 textbox, 1 boton de navegacion, 1 custom visual (menu)

### 2.8 Resumen KPIs (15 visuales)

- **Tipo:** Pagina resumen ejecutivo
- **KPI Cards (9):**
  - Sum(Cantidad absoluta)
  - Sum(Cantidad Transaccion)
  - Bultos por Hora Promedio
  - Min(Lpn Contenido)
  - KPI Eficiencia Descarga (%)
  - Min(Patente Tractor)
  - Min(Fecha De Transaccion)
  - (2 KPIs adicionales contextuales)
- **Filtros:** AGRUP_FAMILIA, Fecha De Transaccion
- **Otros:** 2 imagenes, 1 shape, 1 textbox, 1 boton de navegacion, 1 custom visual (menu)

---

## 3. Modelo de datos

### 3.1 Tablas

| Tabla | Rol | Campos clave |
|-------|-----|-------------|
| **Movimientos** | Tabla de hechos central | Fecha De Transaccion, Cantidad Transaccion, Cantidad absoluta, Costo Total Transaccion, Lpn Contenido |
| **DIM_FAMILIA** | Dimension de productos | AGRUP_FAMILIA (usado como filtro global) |
| **Mapa PL2** | Ubicaciones Planta 2 | Codigo, Total |
| **Mapa PL3** | Ubicaciones Planta 3 | Codigo, Total |
| **Registro contenedores** | Registro de contenedores | KPI Eficiencia Descarga (%) |
| **Vehiculos** | Datos de vehiculos | Patente Tractor |

### 3.2 Medidas

| Medida | Tipo | Descripcion | Paginas donde se usa |
|--------|------|-------------|---------------------|
| `Sum(Cantidad Transaccion)` | Agregacion | Volumen total de unidades operadas | Picking, Movimientos, Recepcion, RMAs, Resumen |
| `Sum(Cantidad absoluta)` | Agregacion | Cantidad en valor absoluto (sin signo) | Picking, Movimientos, Pasajes, Resumen |
| `Sum(Costo Total Transaccion)` | Agregacion | Costo monetario total de las operaciones | RMAs, Pasajes |
| `Bultos por Hora Promedio` | Calculada | Productividad promedio (bultos procesados por hora) | Picking, Resumen |
| `KPI Eficiencia Descarga (%)` | Calculada | Porcentaje de eficiencia en descarga de contenedores | Resumen |
| `Min(Fecha De Transaccion)` | Agregacion | Fecha mas antigua del rango seleccionado | Todas las paginas operativas |
| `Min(Lpn Contenido)` | Agregacion | Identificador de contenedor (primer LPN) | Recepcion, Resumen |
| `Min(Patente Tractor)` | Agregacion | Identificador de vehiculo (primera patente) | Resumen |
| `Sum(Mapa PL2.Total)` | Agregacion | Total de ubicaciones/stock en Planta 2 | Portones |
| `Sum(Mapa PL3.Total)` | Agregacion | Total de ubicaciones/stock en Planta 3 | Portones |

---

## 4. Filtros globales (Slicers)

| Filtro | Tipo | Alcance | Descripcion |
|--------|------|---------|-------------|
| **AGRUP_FAMILIA** | Dropdown / lista | Todas las paginas operativas | Filtra por familia/agrupacion de productos |
| **Fecha De Transaccion** | Date range picker | Todas las paginas operativas | Filtra por rango de fechas de transaccion |
| **Codigo (PL2/PL3)** | Text filter (busqueda) | Solo Portones | Busqueda de codigo de ubicacion por planta |

---

## 5. Patron de diseno (por pagina)

Cada pagina operativa sigue un patron consistente:

```
+----------------------------------------------------------+
|  [Logo/Imagen]     TITULO DE PAGINA      [Custom Visual] |
+----------------------------------------------------------+
|  [Slicer 1] [Slicer 2] [Slicer 3] ...                   |
+----------------------------------------------------------+
|                                                          |
|  [KPI Card 1]  [KPI Card 2]  [KPI Card 3]  [KPI Card 4]|
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  [Tabla detallada / Grafico]                             |
|                                                          |
+----------------------------------------------------------+
|  [Boton: Volver a Contenidos]                            |
+----------------------------------------------------------+
```

### Componentes reutilizables identificados:

1. **KPI Card** — Card visual con valor numerico grande + etiqueta
2. **Tabla detallada** — tableEx con columnas dinamicas segun la pagina
3. **Slicer de fechas** — Date range picker
4. **Slicer de familia** — Dropdown de AGRUP_FAMILIA
5. **Text Filter** — Busqueda de texto libre (solo en Portones)
6. **Donut Chart** — Distribucion porcentual (solo en Picking)
7. **Bar Chart** — Comparacion por categorias (solo en Movimientos)
8. **Boton de navegacion** — Volver al indice
9. **Custom visual de menu** — Navegacion entre paginas

---

## 6. Recursos estaticos

| Recurso | Tipo | Uso |
|---------|------|-----|
| `Portada.png` | PNG | Imagen de fondo de la portada |
| `Fondos_vacios_-_Template_(4).jpg` | JPG | Fondo de paginas operativas |
| `Esquina.png` | PNG | Decoracion de esquinas |
| `Imagen2.png` | PNG | Logo/header |
| `Imagen3.png` | PNG | Logo/header secundario |
| `Imagen3.png` (alt) | PNG | Imagen auxiliar |
| `Template_OCASA.json` | JSON | Tema de colores y fuentes OCASA |
| `calendario-unscreen.gif` | GIF | Icono animado de calendario |
| `camion-de-reparto-1-unscreen.gif` | GIF | Icono animado de camion |
| `camion-de-reparto.gif` | GIF | Icono animado de camion (variante) |
| `grafico-de-linea-unscreen.gif` | GIF | Icono animado de grafico |
| `objetivo-unscreen.gif` | GIF | Icono animado de objetivo/target |

---

## 7. Especificacion para replicacion web

### Paginas a implementar

| Ruta web propuesta | Pagina PBI | Prioridad |
|-------------------|------------|-----------|
| `/` | Contenidos (menu) | Alta |
| `/picking` | Picking | Alta |
| `/movimientos` | Movimientos | Alta |
| `/recepcion` | Recepcion | Alta |
| `/rmas` | RMAs | Media |
| `/pasajes-segunda` | Pasajes a segunda | Media |
| `/portones` | Portones | Alta |
| `/resumen` | Resumen KPIs | Alta |

### Componentes necesarios

| Componente | Libreria sugerida | Cantidad de instancias |
|-----------|-------------------|----------------------|
| KPI Card | shadcn/ui Card | ~28 en total |
| Data Table con filtros | @tanstack/react-table + shadcn | 8 tablas |
| Date Range Picker | shadcn/ui DatePicker | 1 global |
| Dropdown Filter | shadcn/ui Select/Combobox | 1 global (familia) |
| Text Search Filter | shadcn/ui Input | 2 (solo Portones) |
| Donut Chart | Recharts PieChart | 1 (Picking) |
| Bar Chart | Recharts BarChart | 1 (Movimientos) |
| Sidebar / Navegacion | shadcn/ui + custom | 1 global |
| Boton navegacion | shadcn/ui Button | 1 por pagina |

### Fuente de datos a conectar

- **Principal:** SQL Server (tabla Movimientos + dimensiones)
- **Mapas PL2/PL3:** SQL Server o fuente separada
- **Contenedores:** Tabla de registro de contenedores
- **Vehiculos:** Tabla de vehiculos
- **Fase 1:** Mock data replicando la estructura del modelo
- **Fase 2:** Conexion real via API routes + Supabase como cache

---

## 8. Notas adicionales

- El tablero no tiene Power Query (M code) embebido, lo que indica que consume un dataset ya publicado en el servicio de Power BI.
- El custom visual `PBI_CV_16948668...` aparece en todas las paginas operativas y funciona como navegacion/menu lateral.
- El `textFilter25A4...` es un custom visual de busqueda de texto que solo se usa en la pagina Portones.
- El tema OCASA (`Template_OCASA.json`) define los colores y fuentes corporativos que deben replicarse en la version web.
