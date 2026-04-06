import { Router } from 'express';
import { query as dbQuery } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
    try {
        const [{ rows: estados }, { rows: [stats] }, { rows: recientes }] = await Promise.all([
            dbQuery(
                `SELECT estado, COUNT(*) AS count FROM ordenes GROUP BY estado`
            ),
            dbQuery(
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
            dbQuery(
                `SELECT o.id, o.numero_orden, o.tipo_trabajo, o.estado, o.precio,
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

export default router;
