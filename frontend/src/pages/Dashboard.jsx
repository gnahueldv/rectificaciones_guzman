import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatMoney, formatDate } from '../lib/api.js';
import { EstadoBadge, Spinner } from '../components/ui/index.jsx';

const FILTROS = [
  { key: 'todos',      label: 'Todas' },
  { key: 'ingresado',  label: 'Ingresado' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'terminado',  label: 'Terminado' },
  { key: 'atrasado',   label: 'Atrasado' },
];

const ESTADO_COLOR = {
  todos:      '#4b5563',
  ingresado:  '#4b5563',
  en_proceso: '#f59e0b',
  terminado:  '#10b981',
  atrasado:   '#ef4444',
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState('todos');
  const [search, setSearch]   = useState('');
  const navigate = useNavigate();

  async function cargar() {
    try {
      const d = await api.dashboard();
      setData(d);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, []);

  if (loading) return <Spinner />;
  if (!data)   return <div style={{ color: '#ef4444', padding: 20 }}>Error de conexión</div>;

  const { trabajos_activos = [], stats = {} } = data;

  const today = new Date().toISOString().split('T')[0];

  const filtradas = trabajos_activos.filter(o => {
    const esAtrasada = o.estado !== 'entregado' && o.fecha_entrega_estimada && o.fecha_entrega_estimada < today;
    const estadoEfectivo = esAtrasada ? 'atrasado' : o.estado;
    const matchFiltro = filtro === 'todos' || estadoEfectivo === filtro;
    const matchSearch = !search
      || o.tipo_trabajo?.toLowerCase().includes(search.toLowerCase())
      || o.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
      || o.motor_code?.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  // Contar por estado para badges en filtros
  const counts = trabajos_activos.reduce((acc, o) => {
    const esAtrasada = o.estado !== 'entregado' && o.fecha_entrega_estimada && o.fecha_entrega_estimada < today;
    const key = esAtrasada ? 'atrasado' : o.estado;
    acc[key] = (acc[key] || 0) + 1;
    acc.todos = (acc.todos || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── BUSCADOR ─────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, pointerEvents: 'none', opacity: 0.4,
        }}>🔍</span>
        <input
          className="taller-input"
          placeholder="Buscar cliente, motor, orden..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 42, background: '#090a0c' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >✕</button>
        )}
      </div>

      {/* ── STATS CARDS ──────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        <StatMini
          label="Activos"
          value={trabajos_activos.filter(o => o.estado !== 'entregado').length}
          color="#ef4444"
          icon="🔧"
        />
        <StatMini
          label="Ingresados hoy"
          value={trabajos_activos.filter(o => o.fecha_ingreso === today).length}
          color="#60a5fa"
          icon="📥"
        />
        <StatMini
          label="En proceso"
          value={counts.en_proceso || 0}
          color="#f59e0b"
          icon="⚙️"
        />
        <StatMini
          label="Atrasados"
          value={counts.atrasado || 0}
          color={counts.atrasado > 0 ? '#ef4444' : '#4b5563'}
          icon={counts.atrasado > 0 ? '⚠️' : '✅'}
        />
      </div>

      {/* ── FILTROS ──────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {FILTROS.map(f => {
          const active = filtro === f.key;
          const color = ESTADO_COLOR[f.key];
          const count = counts[f.key] || 0;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: `1.5px solid ${color}`,
                background: active ? color : 'transparent',
                color: active ? '#fff' : color,
                fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
              }}
            >
              {f.label}
              {count > 0 && (
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : `${color}33`,
                  color: active ? '#fff' : color,
                  borderRadius: 10, padding: '0 6px',
                  fontSize: 10, fontWeight: 800,
                  minWidth: 18, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TÍTULO SECCIÓN ───────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {filtradas.length} {filtradas.length === 1 ? 'orden' : 'órdenes'}
        </span>
        {search && (
          <span style={{ fontSize: 12, color: '#475569' }}>
            resultado{filtradas.length !== 1 ? 's' : ''} para "{search}"
          </span>
        )}
      </div>

      {/* ── LISTA DE ÓRDENES ─────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#334155' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚙️</div>
            <div style={{ fontSize: 15 }}>Sin órdenes{search ? ` para "${search}"` : ''}</div>
          </div>
        )}

        {filtradas.map(orden => {
          const esAtrasada = orden.estado !== 'entregado'
            && orden.fecha_entrega_estimada
            && orden.fecha_entrega_estimada < today;

          const borderColor = esAtrasada
            ? '#7f1d1d'
            : orden.estado === 'en_proceso' ? '#78350f'
            : orden.estado === 'terminado' ? '#14532d'
            : '#1e293b';

          return (
            <div
              key={orden.id}
              onClick={() => navigate(`/ordenes/${orden.id}`)}
              style={{
                background: '#141b27',
                borderRadius: 16,
                border: `1px solid ${borderColor}`,
                borderLeft: `4px solid ${esAtrasada ? '#ef4444' : orden.estado === 'en_proceso' ? '#f59e0b' : orden.estado === 'terminado' ? '#10b981' : '#334155'}`,
                padding: '16px',
                cursor: 'pointer',
                transition: 'transform 0.15s, background 0.15s',
                active: { transform: 'scale(0.98)' },
              }}
              onPointerDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Fila 1: Tipo de trabajo + Código */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, flex: 1, marginRight: 8 }}>
                  {orden.tipo_trabajo}
                </div>
                <div style={{
                  fontSize: 10, color: '#334155', fontFamily: 'monospace',
                  background: '#0d1117', padding: '2px 7px', borderRadius: 4,
                  border: '1px solid #1e293b', flexShrink: 0,
                }}>
                  {orden.motor_code}
                </div>
              </div>

              {/* Fila 2: Cliente */}
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
                {orden.cliente_nombre}
              </div>

              {/* Fila 3: Badge + Precio */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <EstadoBadge estado={orden.estado} atrasado={esAtrasada} />
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>
                  {formatMoney(orden.precio)}
                </div>
              </div>

              {/* Fila 4: Fechas */}
              <div style={{
                fontSize: 11, color: '#475569',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                paddingTop: 10,
                display: 'flex', gap: 12,
              }}>
                <span>📥 Ingreso: {formatDate(orden.fecha_ingreso)}</span>
                <span style={{ color: esAtrasada ? '#ef4444' : '#475569' }}>
                  🚚 Entrega: {formatDate(orden.fecha_entrega_estimada)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat mini card ────────────────────────────────────────────────────────────
function StatMini({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#141b27',
      border: '1px solid #1e293b',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
