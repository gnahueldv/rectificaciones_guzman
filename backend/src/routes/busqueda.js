import { Router } from 'express';
import { query as dbQuery } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2)
            return res.status(400).json({ error: 'Query mínimo 2 caracteres' });

        const term = `%${q.trim().toUpperCase()}%`;
        const termLow = `%${q.trim().toLowerCase()}%`;

        const [{ rows: motores }, { rows: clientes }, { rows: ordenes }] = await Promise.all([
            dbQuery(
                `SELECT m.code, m.tipo_motor, m.id, c.nombre AS cliente_nombre
         FROM motores m JOIN clientes c ON c.id = m.cliente_id
         WHERE UPPER(m.code) LIKE $1 OR UPPER(m.tipo_motor) LIKE $1
         LIMIT 10`,
                [term]
            ),
            dbQuery(
                `SELECT id, nombre, telefono FROM clientes
         WHERE UPPER(nombre) LIKE $1 OR telefono LIKE $2 LIMIT 10`,
                [term, termLow]
            ),
            dbQuery(
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

export default router;
