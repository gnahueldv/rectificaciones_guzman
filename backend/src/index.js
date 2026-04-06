import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';

import clientesRouter    from './routes/clientes.js';
import motoresRouter     from './routes/motores.js';
import ordenesRouter     from './routes/ordenes.js';
import cajaRouter        from './routes/caja.js';
import dashboardRouter   from './routes/dashboard.js';
import busquedaRouter    from './routes/busqueda.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
const resolvedPublicPath = path.resolve('public');
app.use(express.static(resolvedPublicPath));
app.use('/v1/clientes',   clientesRouter);
app.use('/v1/motores',    motoresRouter);
app.use('/v1/ordenes',    ordenesRouter);
app.use('/v1/caja',       cajaRouter);
app.use('/v1/dashboard',  dashboardRouter);
app.use('/v1/busqueda',   busquedaRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// Fallback para React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(resolvedPublicPath + '/index.html');
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

// Ping automático para evitar que hosting gratuito (como Render) entre en suspensión
const BACKEND_URL = process.env.BACKEND_URL;
if (BACKEND_URL) {
  setInterval(() => {
    fetch(`${BACKEND_URL}/health`)
      .then(res => console.log(`[Anti-Sleep] Ping exitoso (${new Date().toLocaleTimeString()}): ${res.status}`))
      .catch(err => console.error('[Anti-Sleep] Error en ping:', err.message));
  }, 10 * 60 * 1000); // 10 minutos
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🔧 Rectificaciones Guzmán API`);
  console.log(`   Escuchando en puerto ${PORT}\n`);
});
