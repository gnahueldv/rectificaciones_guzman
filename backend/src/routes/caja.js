import { Router } from 'express';
import { query as dbQuery } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
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

router.post('/', async (req, res, next) => {
    try {
        const { tipo, monto, concepto, ordenId, fecha } = req.body;
        if (!tipo || !monto || !concepto)
            return res.status(400).json({ error: 'tipo, monto y concepto son requeridos' });
        const { rows: [mov] } = await dbQuery(
            `INSERT INTO caja (tipo, monto, concepto, orden_id, fecha)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [tipo, monto, concepto, ordenId || null, fecha || null]
        );
        res.status(201).json(mov);
    } catch (e) { next(e); }
});

export default router;
