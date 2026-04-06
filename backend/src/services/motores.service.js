import { query, getClient } from '../db/pool.js';

// ── Generar código único GYY-NNNN (transacción atómica) ──────────────────────
export async function crearMotor({ clienteId, tipoMotor, observaciones }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Genera el próximo código atómicamente desde la función SQL
    const { rows: [seq] } = await client.query('SELECT * FROM next_motor_code()');

    const { rows: [motor] } = await client.query(
      `INSERT INTO motores (code, year, sequence, cliente_id, tipo_motor, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [seq.code, seq.year, seq.sequence, clienteId, tipoMotor, observaciones]
    );

    await client.query('COMMIT');
    return motor;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Listar motores ────────────────────────────────────────────────────────────
export async function listarMotores({ page = 1, limit = 30, clienteId } = {}) {
  const offset = (page - 1) * limit;
  const params = [limit, offset];
  let where = '';
  if (clienteId) {
    params.push(clienteId);
    where = `WHERE m.cliente_id = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT m.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
            COUNT(o.id) AS total_ordenes,
            MAX(o.updated_at) AS ultima_actividad
     FROM motores m
     JOIN clientes c ON c.id = m.cliente_id
     LEFT JOIN ordenes o ON o.motor_id = m.id
     ${where}
     GROUP BY m.id, c.nombre, c.telefono
     ORDER BY m.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

// ── Obtener motor por código ──────────────────────────────────────────────────
export async function obtenerMotorPorCodigo(code) {
  const { rows } = await query(
    `SELECT m.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM motores m
     JOIN clientes c ON c.id = m.cliente_id
     WHERE m.code = $1`,
    [code.toUpperCase()]
  );
  if (!rows.length) return null;

  const motor = rows[0];

  // Historial de órdenes
  const { rows: ordenes } = await query(
    `SELECT o.*, rt.diametro_original, rt.diametro_final, rt.tolerancia, rt.juego_piston
     FROM ordenes o
     LEFT JOIN registro_tecnico rt ON rt.orden_id = o.id
     WHERE o.motor_id = $1
     ORDER BY o.created_at DESC`,
    [motor.id]
  );

  return { ...motor, ordenes };
}

// ── Obtener motor por ID ──────────────────────────────────────────────────────
export async function obtenerMotorPorId(id) {
  const { rows } = await query(
    `SELECT m.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM motores m
     JOIN clientes c ON c.id = m.cliente_id
     WHERE m.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// ── Borrar motor ─────────────────────────────────────────────────────────────
export async function borrarMotor(id) {
  const { rows } = await query('DELETE FROM motores WHERE id = $1 RETURNING *', [id]);
  if (!rows.length) {
    const err = new Error('Motor no encontrado');
    err.status = 404;
    throw err;
  }
  return rows[0];
}
