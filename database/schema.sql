-- ============================================================
-- RECTIFICACIONES GUZMÁN - La Plata, Buenos Aires
-- Schema PostgreSQL v1.0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
CREATE TABLE clientes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(120) NOT NULL,
    telefono    VARCHAR(30),
    observaciones TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_nombre ON clientes (nombre);

-- ------------------------------------------------------------
-- MOTOR SEQUENCES  (control de secuencia por año)
-- ------------------------------------------------------------
CREATE TABLE motor_sequences (
    year            INT PRIMARY KEY,
    last_sequence   INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------
-- MOTORES
-- ------------------------------------------------------------
CREATE TABLE motores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(12) NOT NULL,
    year        INT NOT NULL,
    sequence    INT NOT NULL,
    cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    tipo_motor  VARCHAR(100),
    observaciones TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_motor_code    UNIQUE (code),
    CONSTRAINT uq_motor_year_seq UNIQUE (year, sequence)
);

CREATE INDEX idx_motores_code       ON motores (code);
CREATE INDEX idx_motores_cliente_id ON motores (cliente_id);
CREATE INDEX idx_motores_year       ON motores (year);

-- ------------------------------------------------------------
-- FUNCIÓN: genera el próximo código GYY-NNNN (atómico)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_motor_code()
RETURNS TABLE(code TEXT, year INT, sequence INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_year      INT := EXTRACT(YEAR FROM NOW())::INT;
    v_yy        TEXT := RIGHT(v_year::TEXT, 2);
    v_seq       INT;
BEGIN
    INSERT INTO motor_sequences (year, last_sequence)
    VALUES (v_year, 1)
    ON CONFLICT ON CONSTRAINT motor_sequences_pkey DO UPDATE
        SET last_sequence = motor_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;

    RETURN QUERY SELECT
        ('G' || v_yy || '-' || LPAD(v_seq::TEXT, 4, '0'))::TEXT,
        v_year,
        v_seq;
END;
$$;

-- ------------------------------------------------------------
-- ÓRDENES DE TRABAJO
-- ------------------------------------------------------------
CREATE TYPE orden_estado AS ENUM (
    'ingresado',
    'en_proceso',
    'terminado',
    'entregado'
);

CREATE TABLE ordenes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden            VARCHAR(20) NOT NULL UNIQUE,
    cliente_id              UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    motor_id                UUID NOT NULL REFERENCES motores(id) ON DELETE RESTRICT,
    tipo_trabajo            VARCHAR(120) NOT NULL,
    sobremedida             NUMERIC(5,2),
    fecha_ingreso           DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_estimada  DATE,
    fecha_entrega_real      DATE,
    precio                  NUMERIC(12,2),
    estado                  orden_estado NOT NULL DEFAULT 'ingresado',
    observaciones           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ordenes_estado      ON ordenes (estado);
CREATE INDEX idx_ordenes_cliente_id  ON ordenes (cliente_id);
CREATE INDEX idx_ordenes_motor_id    ON ordenes (motor_id);
CREATE INDEX idx_ordenes_fecha       ON ordenes (fecha_ingreso DESC);

-- Trigger: actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_ordenes_updated_at
BEFORE UPDATE ON ordenes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Función para generar número de orden (OYY-NNNNNN)
CREATE SEQUENCE orden_seq START 1;
CREATE OR REPLACE FUNCTION next_numero_orden()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_yy TEXT := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
BEGIN
    RETURN 'O' || v_yy || '-' || LPAD(nextval('orden_seq')::TEXT, 6, '0');
END;
$$;

-- ------------------------------------------------------------
-- REGISTRO TÉCNICO
-- ------------------------------------------------------------
CREATE TABLE registro_tecnico (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id            UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    diametro_original   NUMERIC(8,4),
    diametro_final      NUMERIC(8,4),
    tolerancia          NUMERIC(8,4),
    juego_piston        NUMERIC(8,4),
    observaciones       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_registro_orden UNIQUE (orden_id)
);

-- ------------------------------------------------------------
-- CAJA
-- ------------------------------------------------------------
CREATE TYPE caja_tipo AS ENUM ('ingreso', 'egreso');

CREATE TABLE caja (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo        caja_tipo NOT NULL,
    monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    concepto    VARCHAR(200) NOT NULL,
    orden_id    UUID REFERENCES ordenes(id) ON DELETE SET NULL,
    fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_caja_fecha  ON caja (fecha DESC);
CREATE INDEX idx_caja_tipo   ON caja (tipo);

-- ------------------------------------------------------------
-- DATOS DE EJEMPLO (opcional, borrar en producción)
-- ------------------------------------------------------------
INSERT INTO clientes (nombre, telefono) VALUES
    ('Juan Pérez',    '221-445-1234'),
    ('Taller El Sol', '221-332-9876'),
    ('Carlos Rimoli',  '221-567-4321');
