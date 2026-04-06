import { Router } from 'express';
import {
    crearOrden, listarOrdenes, obtenerOrden,
    cambiarEstado, actualizarOrden, guardarRegistroTecnico,
    borrarOrden
} from '../services/ordenes.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const rows = await listarOrdenes(req.query);
        res.json(rows);
    } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
    try {
        const { clienteId, motorId, tipoTrabajo } = req.body;
        if (!clienteId || !motorId || !tipoTrabajo)
            return res.status(400).json({ error: 'clienteId, motorId y tipoTrabajo son requeridos' });
        const orden = await crearOrden(req.body);
        res.status(201).json(orden);
    } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const orden = await obtenerOrden(req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(orden);
    } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
    try {
        const orden = await actualizarOrden(req.params.id, req.body);
        if (!orden) return res.status(404).json({ error: 'No encontrada' });
        res.json(orden);
    } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const orden = await borrarOrden(req.params.id);
        res.json(orden);
    } catch (e) { next(e); }
});

// Cambio rápido de estado (botón kanban)
router.patch('/:id/estado', async (req, res, next) => {
    try {
        const orden = await cambiarEstado(req.params.id, req.body.estado);
        res.json(orden);
    } catch (e) { next(e); }
});

// Registro técnico
router.put('/:id/tecnico', async (req, res, next) => {
    try {
        const rt = await guardarRegistroTecnico(req.params.id, req.body);
        res.json(rt);
    } catch (e) { next(e); }
});

export default router;
