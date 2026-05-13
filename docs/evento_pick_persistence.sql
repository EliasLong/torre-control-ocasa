-- ============================================================
-- EVENTO: Persistencia de Pick B2C / Pick B2B
-- ============================================================
-- Propósito: Almacenar de forma segura los datos de picking
--            (B2C y B2B) del Evento HotSale/Cyber 2026,
--            evitando pérdida de información si el cron falla
--            o si las fuentes de datos se vacían.
--
-- Ejecutar en Railway / Supabase una sola vez.
-- Es idempotente: se puede ejecutar múltiples veces sin error.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABLA PRINCIPAL DE SNAPSHOTS KPI
--    Un único registro por día (la fotografía canónica).
--    Incluye TODAS las columnas que usa el cron, incluyendo
--    las de Ingresados por tipo de transporte.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evento_kpi_snapshots (
    date                DATE        NOT NULL PRIMARY KEY,

    -- Pick (fuente: movimientos WMS)
    bultos_b2c          INTEGER     NOT NULL DEFAULT 0,
    bultos_b2b          INTEGER     NOT NULL DEFAULT 0,

    -- Pallets (fuente: hojas B2C/B2B)
    pallets_b2c         INTEGER     NOT NULL DEFAULT 0,
    pallets_b2b         INTEGER     NOT NULL DEFAULT 0,

    -- Viajes (legacy, mantenido por compatibilidad)
    trips_b2c           INTEGER     NOT NULL DEFAULT 0,
    trips_b2b           INTEGER     NOT NULL DEFAULT 0,

    -- Despacho
    despachados_bultos  INTEGER     NOT NULL DEFAULT 0,
    camiones_desp_b2b   INTEGER     NOT NULL DEFAULT 0,

    -- Otros KPIs
    devoluciones        INTEGER     NOT NULL DEFAULT 0,
    incidencias         INTEGER     NOT NULL DEFAULT 0,

    -- Ingresados (snapshot 6 AM, no se actualiza luego)
    ingresados          INTEGER     NOT NULL DEFAULT 0,
    ingresados_flota    INTEGER     NOT NULL DEFAULT 0,

    -- Volumen por Transporte (desglose de Ingresados)
    ing_reti_meli       INTEGER     NOT NULL DEFAULT 0,
    ing_andreani        INTEGER     NOT NULL DEFAULT 0,
    ing_flota_propia    INTEGER     NOT NULL DEFAULT 0,
    ing_otros           INTEGER     NOT NULL DEFAULT 0,

    -- Auditoría
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agrega columnas faltantes si la tabla ya existe (migraciones seguras)
ALTER TABLE evento_kpi_snapshots
    ADD COLUMN IF NOT EXISTS ing_reti_meli    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evento_kpi_snapshots
    ADD COLUMN IF NOT EXISTS ing_andreani     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evento_kpi_snapshots
    ADD COLUMN IF NOT EXISTS ing_flota_propia INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evento_kpi_snapshots
    ADD COLUMN IF NOT EXISTS ing_otros        INTEGER NOT NULL DEFAULT 0;


-- ──────────────────────────────────────────────────────────────
-- 2. TABLA DE HISTORIAL GRANULAR DE PICKING
--    Guarda CADA actualización de Pick B2C / B2B con su timestamp.
--    Esto evita que un cron que corra con valor 0 sobreescriba
--    datos correctos. El dashboard puede usar el MAX del día.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evento_pick_history (
    id              BIGSERIAL   PRIMARY KEY,

    -- Fecha del evento operacional (en hora Buenos Aires)
    date            DATE        NOT NULL,

    -- Valores de picking en este momento
    bultos_b2c      INTEGER     NOT NULL DEFAULT 0,
    bultos_b2b      INTEGER     NOT NULL DEFAULT 0,

    -- Origen del registro para diagnóstico
    -- 'cron_6am' | 'cron_hourly' | 'manual' | 'recovery'
    source          VARCHAR(30) NOT NULL DEFAULT 'cron_hourly',

    -- Hora exacta de la captura (en UTC; sumar -3h para Argentina)
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para acelerar consultas por día
CREATE INDEX IF NOT EXISTS idx_pick_history_date
    ON evento_pick_history (date DESC);

-- Índice compuesto para buscar el máximo por día rápidamente
CREATE INDEX IF NOT EXISTS idx_pick_history_date_b2c
    ON evento_pick_history (date, bultos_b2c DESC);

CREATE INDEX IF NOT EXISTS idx_pick_history_date_b2b
    ON evento_pick_history (date, bultos_b2b DESC);


-- ──────────────────────────────────────────────────────────────
-- 3. TABLA DE RESPALDO DE LA HOJA INGRESADOS
--    Guarda el JSON completo de la hoja para no perder datos
--    si Google Sheets es modificada o borrada.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evento_ingresados_backups (
    date            DATE        NOT NULL PRIMARY KEY,
    data            JSONB       NOT NULL DEFAULT '[]',
    snapshot_time   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ──────────────────────────────────────────────────────────────
-- 4. FUNCIÓN AUXILIAR: obtener el máximo Pick por día
--    Permite al dashboard recuperar el mayor valor registrado
--    para un día, incluso si el último cron corrió con 0.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_max_pick_for_date(p_date DATE)
RETURNS TABLE (
    max_b2c INTEGER,
    max_b2b INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(MAX(h.bultos_b2c), 0) AS max_b2c,
        COALESCE(MAX(h.bultos_b2b), 0) AS max_b2b
    FROM evento_pick_history h
    WHERE h.date = p_date;
END;
$$ LANGUAGE plpgsql STABLE;


-- ──────────────────────────────────────────────────────────────
-- 5. VISTA: resumen diario con el máximo pick del historial
--    Combina el snapshot oficial con el historial granular.
--    Útil para diagnosticar diferencias entre snapshot y real.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_evento_pick_diario AS
SELECT
    s.date,
    -- Valor oficial del snapshot (canónico)
    s.bultos_b2c                                    AS snap_b2c,
    s.bultos_b2b                                    AS snap_b2b,
    -- Máximo registrado en el historial granular
    COALESCE(MAX(h.bultos_b2c), 0)                  AS hist_max_b2c,
    COALESCE(MAX(h.bultos_b2b), 0)                  AS hist_max_b2b,
    -- Valor definitivo: el mayor entre snapshot e historial
    GREATEST(s.bultos_b2c, COALESCE(MAX(h.bultos_b2c), 0)) AS pick_b2c,
    GREATEST(s.bultos_b2b, COALESCE(MAX(h.bultos_b2b), 0)) AS pick_b2b,
    s.updated_at                                    AS snapshot_updated_at,
    MAX(h.captured_at)                              AS last_pick_capture
FROM evento_kpi_snapshots s
LEFT JOIN evento_pick_history h ON h.date = s.date
GROUP BY
    s.date, s.bultos_b2c, s.bultos_b2b, s.updated_at;


-- ──────────────────────────────────────────────────────────────
-- 6. DATOS HISTÓRICOS CONOCIDOS (Hot Sale / Cyber 2026)
--    Inserta los valores que se conocen con certeza para los
--    días que ya pasaron. Usa ON CONFLICT DO NOTHING para no
--    sobreescribir datos ya correctos.
-- ──────────────────────────────────────────────────────────────

-- D1: 11/05/2026 (valores recuperados manualmente)
INSERT INTO evento_kpi_snapshots (date, bultos_b2c, bultos_b2b)
VALUES ('2026-05-11', 1736, 1635)
ON CONFLICT (date) DO UPDATE SET
    bultos_b2c = CASE WHEN evento_kpi_snapshots.bultos_b2c = 0 THEN EXCLUDED.bultos_b2c ELSE evento_kpi_snapshots.bultos_b2c END,
    bultos_b2b = CASE WHEN evento_kpi_snapshots.bultos_b2b = 0 THEN EXCLUDED.bultos_b2b ELSE evento_kpi_snapshots.bultos_b2b END,
    updated_at = NOW();

-- También al historial granular (marcado como 'recovery')
INSERT INTO evento_pick_history (date, bultos_b2c, bultos_b2b, source, captured_at)
VALUES ('2026-05-11', 1736, 1635, 'recovery', '2026-05-11 12:00:00+00')
ON CONFLICT DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- 7. CONSULTAS DE VERIFICACIÓN (ejecutar manualmente)
-- ──────────────────────────────────────────────────────────────

-- Ver el estado completo de cada día del evento:
-- SELECT * FROM v_evento_pick_diario ORDER BY date;

-- Ver historial de capturas de hoy:
-- SELECT * FROM evento_pick_history
-- WHERE date = CURRENT_DATE AT TIME ZONE 'America/Argentina/Buenos_Aires'
-- ORDER BY captured_at DESC;

-- Ver snapshot completo de todos los días:
-- SELECT date, bultos_b2c, bultos_b2b, updated_at
-- FROM evento_kpi_snapshots
-- ORDER BY date;

-- ──────────────────────────────────────────────────────────────
-- FIN DEL SCRIPT
-- ──────────────────────────────────────────────────────────────
