// ══════════════════════════════════════════════════════════════
// routes/motores.js
// ══════════════════════════════════════════════════════════════
import { Router } from 'express';
import {
  crearMotor, listarMotores,
  obtenerMotorPorCodigo, obtenerMotorPorId
} from '../services/motores.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, clienteId } = req.query;
    const rows = await listarMotores({ page, limit, clienteId });
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { clienteId, tipoMotor, observaciones } = req.body;
    if (!clienteId) return res.status(400).json({ error: 'clienteId requerido' });
    const motor = await crearMotor({ clienteId, tipoMotor, observaciones });
    res.status(201).json(motor);
  } catch (e) { next(e); }
});

// Búsqueda por código (ej: /motores/codigo/G26-0001)
router.get('/codigo/:code', async (req, res, next) => {
  try {
    const motor = await obtenerMotorPorCodigo(req.params.code);
    if (!motor) return res.status(404).json({ error: 'Motor no encontrado' });
    res.json(motor);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const motor = await obtenerMotorPorId(req.params.id);
    if (!motor) return res.status(404).json({ error: 'Motor no encontrado' });
    res.json(motor);
  } catch (e) { next(e); }
});

export default router;


// ══════════════════════════════════════════════════════════════
// routes/ordenes.js
// ══════════════════════════════════════════════════════════════
import { Router as Router2 } from 'express';
import {
  crearOrden, listarOrdenes, obtenerOrden,
  cambiarEstado, actualizarOrden, guardarRegistroTecnico
} from '../services/ordenes.service.js';

const ordenesRouter = Router2();

ordenesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await listarOrdenes(req.query);
    res.json(rows);
  } catch (e) { next(e); }
});

ordenesRouter.post('/', async (req, res, next) => {
  try {
    const { clienteId, motorId, tipoTrabajo } = req.body;
    if (!clienteId || !motorId || !tipoTrabajo)
      return res.status(400).json({ error: 'clienteId, motorId y tipoTrabajo son requeridos' });
    const orden = await crearOrden(req.body);
    res.status(201).json(orden);
  } catch (e) { next(e); }
});

ordenesRouter.get('/:id', async (req, res, next) => {
  try {
    const orden = await obtenerOrden(req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(orden);
  } catch (e) { next(e); }
});

ordenesRouter.put('/:id', async (req, res, next) => {
  try {
    const orden = await actualizarOrden(req.params.id, req.body);
    if (!orden) return res.status(404).json({ error: 'No encontrada' });
    res.json(orden);
  } catch (e) { next(e); }
});

// Cambio rápido de estado (botón kanban)
ordenesRouter.patch('/:id/estado', async (req, res, next) => {
  try {
    const orden = await cambiarEstado(req.params.id, req.body.estado);
    res.json(orden);
  } catch (e) { next(e); }
});

// Registro técnico
ordenesRouter.put('/:id/tecnico', async (req, res, next) => {
  try {
    const rt = await guardarRegistroTecnico(req.params.id, req.body);
    res.json(rt);
  } catch (e) { next(e); }
});

export { ordenesRouter };


// ══════════════════════════════════════════════════════════════
// routes/caja.js
// ══════════════════════════════════════════════════════════════
import { Router as Router3 } from 'express';
import { query as dbQuery } from '../db/pool.js';

const cajaRouter = Router3();

cajaRouter.get('/', async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const params = [];
    let where = '';
    if (desde) { params.push(desde); where += ` AND fecha >= $${params.length}`; }
    if (hasta) { params.push(hasta); where += ` AND fecha <= $${params.length}`; }

    const { rows } = await dbQuery(
      `SELECT c.*, o.numero_orden FROM caja c
       LEFT JOIN ordenes o ON o.id = c.orden_id
       WHERE TRUE ${where} ORDER BY c.fecha DESC, c.created_at DESC`,
      params
    );

    const { rows: [balance] } = await dbQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto END),0) AS total_ingresos,
         COALESCE(SUM(CASE WHEN tipo='egreso'  THEN monto END),0) AS total_egresos,
         COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END),0) AS balance
       FROM caja WHERE TRUE ${where}`,
      params
    );

    res.json({ movimientos: rows, resumen: balance });
  } catch (e) { next(e); }
});

cajaRouter.post('/', async (req, res, next) => {
  try {
    const { tipo, monto, concepto, ordenId, fecha } = req.body;
    if (!tipo || !monto || !concepto)
      return res.status(400).json({ error: 'tipo, monto y concepto son requeridos' });
    const { rows: [mov] } = await dbQuery(
      `INSERT INTO caja (tipo, monto, concepto, orden_id, fecha)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tipo, monto, concepto, ordenId || null, fecha || 'NOW()']
    );
    res.status(201).json(mov);
  } catch (e) { next(e); }
});

export { cajaRouter };


// ══════════════════════════════════════════════════════════════
// routes/dashboard.js
// ══════════════════════════════════════════════════════════════
import { Router as Router4 } from 'express';
import { query as dbQuery2 } from '../db/pool.js';

const dashboardRouter = Router4();

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    const [{ rows: estados }, { rows: [stats] }, { rows: recientes }] = await Promise.all([
      dbQuery2(
        `SELECT estado, COUNT(*) AS count FROM ordenes GROUP BY estado`
      ),
      dbQuery2(
        `SELECT
           COUNT(*)                                        AS total_motores,
           COUNT(*) FILTER (WHERE estado != 'entregado')   AS trabajos_activos,
           COUNT(*) FILTER (WHERE fecha_ingreso = CURRENT_DATE) AS ingresados_hoy,
           COALESCE(
             SUM(precio) FILTER (WHERE estado='entregado'
               AND fecha_entrega_real >= DATE_TRUNC('month', NOW())), 0
           ) AS facturado_mes
         FROM ordenes`
      ),
      dbQuery2(
        `SELECT o.numero_orden, o.tipo_trabajo, o.estado, o.precio,
                o.fecha_entrega_estimada,
                c.nombre AS cliente_nombre,
                m.code   AS motor_code
         FROM ordenes o
         JOIN clientes c ON c.id = o.cliente_id
         JOIN motores  m ON m.id = o.motor_id
         WHERE o.estado != 'entregado'
         ORDER BY o.fecha_ingreso DESC LIMIT 20`
      ),
    ]);

    res.json({
      estados: Object.fromEntries(estados.map(r => [r.estado, parseInt(r.count)])),
      stats: stats,
      trabajos_activos: recientes,
    });
  } catch (e) { next(e); }
});

export { dashboardRouter };


// ══════════════════════════════════════════════════════════════
// routes/busqueda.js
// ══════════════════════════════════════════════════════════════
import { Router as Router5 } from 'express';
import { query as dbQuery3 } from '../db/pool.js';

const busquedaRouter = Router5();

busquedaRouter.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: 'Query mínimo 2 caracteres' });

    const term = `%${q.trim().toUpperCase()}%`;
    const termLow = `%${q.trim().toLowerCase()}%`;

    const [{ rows: motores }, { rows: clientes }, { rows: ordenes }] = await Promise.all([
      dbQuery3(
        `SELECT m.code, m.tipo_motor, m.id, c.nombre AS cliente_nombre
         FROM motores m JOIN clientes c ON c.id = m.cliente_id
         WHERE UPPER(m.code) LIKE $1 OR UPPER(m.tipo_motor) LIKE $1
         LIMIT 10`,
        [term]
      ),
      dbQuery3(
        `SELECT id, nombre, telefono FROM clientes
         WHERE UPPER(nombre) LIKE $1 OR telefono LIKE $2 LIMIT 10`,
        [term, termLow]
      ),
      dbQuery3(
        `SELECT o.numero_orden, o.tipo_trabajo, o.estado, o.id,
                c.nombre AS cliente_nombre, m.code AS motor_code
         FROM ordenes o
         JOIN clientes c ON c.id = o.cliente_id
         JOIN motores  m ON m.id = o.motor_id
         WHERE UPPER(o.numero_orden) LIKE $1 OR UPPER(o.tipo_trabajo) LIKE $1
            OR UPPER(c.nombre) LIKE $1
         LIMIT 10`,
        [term]
      ),
    ]);

    res.json({ motores, clientes, ordenes });
  } catch (e) { next(e); }
});

export { busquedaRouter };
