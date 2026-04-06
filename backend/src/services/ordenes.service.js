import { query, getClient } from '../db/pool.js';

const ESTADOS_VALIDOS = ['ingresado', 'en_proceso', 'terminado', 'entregado'];

// ── Crear orden ───────────────────────────────────────────────────────────────
export async function crearOrden(data) {
  const {
    clienteId, motorId, tipoTrabajo, sobremedida,
    fechaIngreso, fechaEntregaEstimada, precio, observaciones
  } = data;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Genera número de orden
    const { rows: [{ next_numero_orden: numOrden }] } = await client.query(
      'SELECT next_numero_orden()'
    );

    const { rows: [orden] } = await client.query(
      `INSERT INTO ordenes
         (numero_orden, cliente_id, motor_id, tipo_trabajo, sobremedida,
          fecha_ingreso, fecha_entrega_estimada, precio, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [numOrden, clienteId, motorId, tipoTrabajo, sobremedida || null,
       fechaIngreso || 'NOW()', fechaEntregaEstimada || null,
       precio || null, observaciones || null]
    );

    await client.query('COMMIT');
    return orden;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Listar órdenes ────────────────────────────────────────────────────────────
export async function listarOrdenes({ estado, page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const params = [limit, offset];
  let where = '';
  if (estado && ESTADOS_VALIDOS.includes(estado)) {
    params.push(estado);
    where = `WHERE o.estado = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT o.*,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
            m.code   AS motor_code,     m.tipo_motor
     FROM ordenes o
     JOIN clientes c ON c.id = o.cliente_id
     JOIN motores  m ON m.id = o.motor_id
     ${where}
     ORDER BY o.fecha_ingreso DESC, o.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
}

// ── Obtener una orden ─────────────────────────────────────────────────────────
export async function obtenerOrden(id) {
  const { rows } = await query(
    `SELECT o.*,
            c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
            m.code   AS motor_code,     m.tipo_motor,
            rt.diametro_original, rt.diametro_final,
            rt.tolerancia, rt.juego_piston,
            rt.observaciones AS obs_tecnicas
     FROM ordenes o
     JOIN clientes c ON c.id = o.cliente_id
     JOIN motores  m ON m.id = o.motor_id
     LEFT JOIN registro_tecnico rt ON rt.orden_id = o.id
     WHERE o.id = $1`,
    [id]
  );
  return rows[0] || null;
}

// ── Cambiar estado ────────────────────────────────────────────────────────────
export async function cambiarEstado(id, estado) {
  if (!ESTADOS_VALIDOS.includes(estado)) {
    const err = new Error('Estado inválido');
    err.status = 400;
    throw err;
  }

  const extras = estado === 'entregado'
    ? ', fecha_entrega_real = CURRENT_DATE'
    : '';

  const { rows } = await query(
    `UPDATE ordenes SET estado = $1 ${extras} WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  if (!rows.length) {
    const err = new Error('Orden no encontrada');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ── Actualizar orden ──────────────────────────────────────────────────────────
export async function actualizarOrden(id, data) {
  const allowed = [
    'tipo_trabajo', 'sobremedida', 'fecha_entrega_estimada',
    'precio', 'observaciones', 'estado'
  ];
  const fields = Object.keys(data).filter(k => allowed.includes(k));
  if (!fields.length) {
    const err = new Error('Sin campos para actualizar');
    err.status = 400;
    throw err;
  }
  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const vals = fields.map(f => data[f]);
  const { rows } = await query(
    `UPDATE ordenes SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...vals]
  );
  return rows[0] || null;
}

// ── Guardar / actualizar registro técnico ─────────────────────────────────────
export async function guardarRegistroTecnico(ordenId, data) {
  const { diametroOriginal, diametroFinal, tolerancia, juegoPiston, observaciones } = data;
  const { rows } = await query(
    `INSERT INTO registro_tecnico
       (orden_id, diametro_original, diametro_final, tolerancia, juego_piston, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (orden_id) DO UPDATE SET
       diametro_original = EXCLUDED.diametro_original,
       diametro_final    = EXCLUDED.diametro_final,
       tolerancia        = EXCLUDED.tolerancia,
       juego_piston      = EXCLUDED.juego_piston,
       observaciones     = EXCLUDED.observaciones
     RETURNING *`,
    [ordenId, diametroOriginal, diametroFinal, tolerancia, juegoPiston, observaciones]
  );
  return rows[0];
}
// ── Borrar orden ─────────────────────────────────────────────────────────────
export async function borrarOrden(id) {
  const { rows } = await query('DELETE FROM ordenes WHERE id = $1 RETURNING *', [id]);
  if (!rows.length) {
    const err = new Error('Orden no encontrada');
    err.status = 404;
    throw err;
  }
  return rows[0];
}
