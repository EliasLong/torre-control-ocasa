-- ============================================================
-- OCASA Dashboard Financiero — PostgreSQL Schema
-- Run once on the Railway PostgreSQL instance
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email       TEXT          NOT NULL UNIQUE,
    name        TEXT          NOT NULL DEFAULT '',
    password_hash TEXT        NOT NULL,
    role        TEXT          NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('superadmin','admin','viewer')),
    status      TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    tabs        TEXT          NOT NULL DEFAULT '[]',  -- JSON array as text
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Seed superadmin  (password = admin123)
-- bcrypt hash generated with rounds=10
INSERT INTO users (id, email, name, password_hash, role, status, tabs)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@ocasa.com',
    'Administrador',
    '$2b$10$YQvJpPa8RDaq8fYqRBbOaugAoCHLUMH4hdGqLCzmUaYCxk85RsXFm',  -- admin123
    'superadmin',
    'approved',
    '["operacional","indicadores-diarios","financiero","merma","abc-xyz","torre-control","reportes","tracking","estado-del-turno","incidencias"]'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TRACKING TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS tracking_trips (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse           TEXT        NOT NULL CHECK (warehouse IN ('PL2','PL3')),
    trip_type           TEXT        NOT NULL CHECK (trip_type IN ('b2c','b2b')),
    date                DATE        NOT NULL,
    carrier             TEXT        NOT NULL DEFAULT '',
    trip_number         TEXT        NOT NULL DEFAULT '',
    port                TEXT        NOT NULL DEFAULT '',
    task_count          INTEGER     NOT NULL DEFAULT 0,
    operators           TEXT        NOT NULL DEFAULT '[]',  -- JSON
    documents_printed   BOOLEAN     NOT NULL DEFAULT false,
    status              TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('released','pending','picking','closing_pending_invoice','invoiced','cancelled','deleted')),
    created_by          UUID        REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- B2C fields
    pallet_count        INTEGER,
    pallets_dispatched  INTEGER,
    labeler             TEXT,

    -- B2B / shared
    vehicle_plate       TEXT,
    client              TEXT,
    client_shift        TEXT,
    pallets             INTEGER,
    detail              TEXT,
    comments            TEXT,
    bulk_cargo          BOOLEAN,
    retira              TEXT
);

CREATE INDEX IF NOT EXISTS ix_tracking_warehouse ON tracking_trips(warehouse);
CREATE INDEX IF NOT EXISTS ix_tracking_status    ON tracking_trips(status);
CREATE INDEX IF NOT EXISTS ix_tracking_date      ON tracking_trips(date DESC);

-- ============================================================
-- INCIDENCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS incidencias (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse   TEXT        NOT NULL CHECK (warehouse IN ('PL2','PL3')),
    titulo      TEXT        NOT NULL,
    descripcion TEXT        NOT NULL DEFAULT '',
    tipo        TEXT        NOT NULL DEFAULT 'operacional',
    prioridad   TEXT        NOT NULL DEFAULT 'media'
                    CHECK (prioridad IN ('baja','media','alta','critica')),
    estado      TEXT        NOT NULL DEFAULT 'abierta'
                    CHECK (estado IN ('abierta','en_progreso','resuelta','cerrada')),
    created_by  UUID        REFERENCES users(id),
    assigned_to UUID        REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_incidencias_warehouse ON incidencias(warehouse);
CREATE INDEX IF NOT EXISTS ix_incidencias_estado    ON incidencias(estado);
