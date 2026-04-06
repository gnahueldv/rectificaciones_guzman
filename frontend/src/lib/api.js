// ── API base URL ──────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' && window.location.port !== '3001' ? 'http://localhost:3001/v1' : '/v1');

async function http(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  // ── Dashboard ──────────────────────────────────────────────
  dashboard: ()                     => http('/dashboard'),

  // ── Búsqueda global ───────────────────────────────────────
  buscar: (q)                       => http(`/busqueda?q=${encodeURIComponent(q)}`),

  // ── Clientes ──────────────────────────────────────────────
  clientes: {
    listar:  ()          => http('/clientes'),
    crear:   (d)         => http('/clientes', { method:'POST', body:JSON.stringify(d) }),
    obtener: (id)        => http(`/clientes/${id}`),
    editar:  (id, d)     => http(`/clientes/${id}`, { method:'PUT', body:JSON.stringify(d) }),
    borrar:  (id)        => http(`/clientes/${id}`, { method:'DELETE' }),
  },

  // ── Motores ───────────────────────────────────────────────
  motores: {
    listar:     (params = {})  => {
      const qs = new URLSearchParams(params).toString();
      return http(`/motores${qs ? '?'+qs : ''}`);
    },
    crear:      (d)            => http('/motores', { method:'POST', body:JSON.stringify(d) }),
    porCodigo:  (code)         => http(`/motores/codigo/${code}`),
    porId:      (id)           => http(`/motores/${id}`),
    borrar:     (id)           => http(`/motores/${id}`, { method:'DELETE' }),
  },

  // ── Órdenes ───────────────────────────────────────────────
  ordenes: {
    listar:    (params = {})   => {
      const qs = new URLSearchParams(params).toString();
      return http(`/ordenes${qs ? '?'+qs : ''}`);
    },
    crear:     (d)             => http('/ordenes', { method:'POST', body:JSON.stringify(d) }),
    obtener:   (id)            => http(`/ordenes/${id}`),
    editar:    (id, d)         => http(`/ordenes/${id}`, { method:'PUT', body:JSON.stringify(d) }),
    estado:    (id, estado)    => http(`/ordenes/${id}/estado`, { method:'PATCH', body:JSON.stringify({ estado }) }),
    tecnico:   (id, d)         => http(`/ordenes/${id}/tecnico`, { method:'PUT', body:JSON.stringify(d) }),
    borrar:    (id)            => http(`/ordenes/${id}`, { method:'DELETE' }),
  },

  // ── Caja ──────────────────────────────────────────────────
  caja: {
    listar: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return http(`/caja${qs ? '?'+qs : ''}`);
    },
    crear: (d) => http('/caja', { method:'POST', body:JSON.stringify(d) }),
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export const ESTADOS = ['ingresado','en_proceso','terminado','entregado'];

export const ESTADO_LABEL = {
  ingresado:  'Ingresado',
  en_proceso: 'En proceso',
  terminado:  'Terminado',
  entregado:  'Entregado',
};

export const ESTADO_COLOR = {
  ingresado:  { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
  en_proceso: { bg: '#1c1917', text: '#fb923c', border: '#78350f' },
  terminado:  { bg: '#052e16', text: '#4ade80', border: '#14532d' },
  entregado:  { bg: '#0f172a', text: '#60a5fa', border: '#1e3a5f' },
};

export const TIPOS_TRABAJO = [
  'Alesado de cilindros',
  'Rectificado de cigüeñal',
  'Rectificado de tapa',
  'Rectificado de block',
  'Control de desgaste',
  'Medición y tolerancias',
  'Rectificado de volante',
  'Otro',
];

export function formatMoney(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n);
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}
