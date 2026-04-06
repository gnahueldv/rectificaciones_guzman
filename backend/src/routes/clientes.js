// ══════════════════════════════════════════════════════════════
// routes/clientes.js
// ══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.*, COUNT(m.id) AS total_motores, COUNT(o.id) AS total_ordenes
       FROM clientes c
       LEFT JOIN motores  m ON m.cliente_id = c.id
       LEFT JOIN ordenes  o ON o.cliente_id = c.id
       GROUP BY c.id
       ORDER BY c.nombre`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { nombre, telefono, observaciones } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const { rows: [c] } = await query(
      `INSERT INTO clientes (nombre, telefono, observaciones) VALUES ($1,$2,$3) RETURNING *`,
      [nombre.trim(), telefono || null, observaciones || null]
    );
    res.status(201).json(c);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [c] } = await query(`SELECT * FROM clientes WHERE id = $1`, [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
    const { rows: motores } = await query(
      `SELECT m.*, COUNT(o.id) AS total_ordenes
       FROM motores m LEFT JOIN ordenes o ON o.motor_id = m.id
       WHERE m.cliente_id = $1 GROUP BY m.id ORDER BY m.created_at DESC`,
      [req.params.id]
    );
    res.json({ ...c, motores });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nombre, telefono, observaciones } = req.body;
    const { rows: [c] } = await query(
      `UPDATE clientes SET nombre=$1, telefono=$2, observaciones=$3 WHERE id=$4 RETURNING *`,
      [nombre, telefono, observaciones, req.params.id]
    );
    if (!c) return res.status(404).json({ error: 'No encontrado' });
    res.json(c);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM clientes WHERE id = $1 RETURNING *', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

export default router;
