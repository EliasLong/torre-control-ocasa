-- ============================================================
-- OCASA Warehouse Platform — SQL Server Schema
-- Run once on the Railway SQL Server instance
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        email         NVARCHAR(255)    NOT NULL UNIQUE,
        name          NVARCHAR(255)    NOT NULL DEFAULT '',
        password_hash NVARCHAR(255)    NOT NULL,
        role          NVARCHAR(20)     NOT NULL DEFAULT 'viewer'
                          CHECK (role IN ('superadmin','admin','viewer')),
        status        NVARCHAR(20)     NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
        tabs          NVARCHAR(MAX)    NOT NULL DEFAULT '[]', -- JSON array
        created_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

-- Seed superadmin (password = admin123)
-- bcrypt hash of 'admin123' with salt rounds 10
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ocasa.com')
BEGIN
    INSERT INTO users (id, email, name, password_hash, role, status, tabs)
    VALUES (
        'A0000000-0000-0000-0000-000000000001',
        'admin@ocasa.com',
        'Administrador',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "password" — replace in prod
        'superadmin',
        'approved',
        '["operacional","indicadores-diarios","financiero","merma","abc-xyz","torre-control","reportes","tracking","estado-del-turno","incidencias"]'
    );
END

-- ============================================================
-- TRACKING TRIPS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tracking_trips')
BEGIN
    CREATE TABLE tracking_trips (
        id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        warehouse           NVARCHAR(10)     NOT NULL CHECK (warehouse IN ('PL2','PL3')),
        trip_type           NVARCHAR(5)      NOT NULL CHECK (trip_type IN ('b2c','b2b')),
        date                DATE             NOT NULL,
        carrier             NVARCHAR(255)    NOT NULL DEFAULT '',
        trip_number         NVARCHAR(100)    NOT NULL DEFAULT '',
        port                NVARCHAR(100)    NOT NULL DEFAULT '',
        task_count          INT              NOT NULL DEFAULT 0,
        operators           NVARCHAR(MAX)    NOT NULL DEFAULT '[]',  -- JSON
        documents_printed   BIT              NOT NULL DEFAULT 0,
        status              NVARCHAR(50)     NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('released','pending','picking','closing_pending_invoice','invoiced','cancelled','deleted')),
        created_by          UNIQUEIDENTIFIER NULL REFERENCES users(id),
        created_at          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        -- B2C fields
        pallet_count        INT              NULL,
        pallets_dispatched  INT              NULL,
        labeler             NVARCHAR(255)    NULL,

        -- B2B fields
        vehicle_plate       NVARCHAR(20)     NULL,
        client              NVARCHAR(255)    NULL,
        client_shift        NVARCHAR(100)    NULL,
        pallets             INT              NULL,
        detail              NVARCHAR(MAX)    NULL,
        comments            NVARCHAR(MAX)    NULL,
        bulk_cargo          BIT              NULL,
        retira              NVARCHAR(255)    NULL
    );

    CREATE INDEX ix_tracking_warehouse ON tracking_trips(warehouse);
    CREATE INDEX ix_tracking_status    ON tracking_trips(status);
    CREATE INDEX ix_tracking_date      ON tracking_trips(date DESC);
END

-- ============================================================
-- INCIDENCIAS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'incidencias')
BEGIN
    CREATE TABLE incidencias (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        warehouse     NVARCHAR(10)     NOT NULL CHECK (warehouse IN ('PL2','PL3')),
        titulo        NVARCHAR(500)    NOT NULL,
        descripcion   NVARCHAR(MAX)    NOT NULL DEFAULT '',
        tipo          NVARCHAR(50)     NOT NULL DEFAULT 'operacional',
        prioridad     NVARCHAR(20)     NOT NULL DEFAULT 'media'
                          CHECK (prioridad IN ('baja','media','alta','critica')),
        estado        NVARCHAR(20)     NOT NULL DEFAULT 'abierta'
                          CHECK (estado IN ('abierta','en_progreso','resuelta','cerrada')),
        created_by    UNIQUEIDENTIFIER NULL REFERENCES users(id),
        assigned_to   UNIQUEIDENTIFIER NULL REFERENCES users(id),
        created_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        resolved_at   DATETIME2        NULL
    );

    CREATE INDEX ix_incidencias_warehouse ON incidencias(warehouse);
    CREATE INDEX ix_incidencias_estado    ON incidencias(estado);
END
