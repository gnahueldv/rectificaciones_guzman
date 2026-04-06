import { Router } from 'express';
import {
  crearMotor, listarMotores,
  obtenerMotorPorCodigo, obtenerMotorPorId,
  borrarMotor
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

router.delete('/:id', async (req, res, next) => {
  try {
    const motor = await borrarMotor(req.params.id);
    res.json(motor);
  } catch (e) { next(e); }
});

export default router;
