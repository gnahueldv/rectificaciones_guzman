import { useState, useEffect } from 'react';
import { api, formatMoney, formatDate } from '../lib/api.js';
import { Btn, Input, Select, Card, Modal, Spinner, Empty, useToast } from '../components/ui/index.jsx';

export default function Caja() {
  const [data, setData]         = useState({ movimientos: [], resumen: {} });
  const [loading, setLoading]   = useState(true);
  const [modalNuevo, setModal]  = useState(false);
  const [desde, setDesde]       = useState('');
  const [hasta, setHasta]       = useState('');

  async function cargar() {
    setLoading(true);
    const d = await api.caja.listar({ desde, hasta });
    setData(d);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, [desde, hasta]);

  const { movimientos, resumen } = data;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Caja</h1>
        <Btn onClick={() => setModal(true)}>+ Movimiento</Btn>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <Card style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#4ade80', fontFamily: 'monospace' }}>
            {formatMoney(resumen.total_ingresos)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
            {formatMoney(resumen.total_egresos)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Egresos</div>
        </Card>
        <Card style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: parseFloat(resumen.balance) >= 0 ? '#60a5fa' : '#f87171', fontFamily: 'monospace' }}>
            {formatMoney(resumen.balance)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</div>
        </Card>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input label="Desde" value={desde} onChange={setDesde} type="date" />
        </div>
        <div style={{ flex: 1 }}>
          <Input label="Hasta" value={hasta} onChange={setHasta} type="date" />
        </div>
        <Btn variant="ghost" onClick={() => { setDesde(''); setHasta(''); }}>Limpiar</Btn>
      </div>

      {loading && <Spinner />}

      {!loading && movimientos.length === 0 && <Empty msg="Sin movimientos en el período" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {movimientos.map(m => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '100px 1fr auto auto',
            alignItems: 'center', gap: 16, padding: '12px 18px',
            background: '#111827', border: '1px solid #1e293b', borderRadius: 8,
            borderLeft: `3px solid ${m.tipo === 'ingreso' ? '#166534' : '#991b1b'}`,
          }}>
            <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>
              {formatDate(m.fecha)}
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontSize: 14 }}>{m.concepto}</div>
              {m.numero_orden && (
                <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>
                  Orden: {m.numero_orden}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              color: m.tipo === 'ingreso' ? '#4ade80' : '#f87171',
              background: m.tipo === 'ingreso' ? '#052e16' : '#450a0a',
              border: `1px solid ${m.tipo === 'ingreso' ? '#14532d' : '#7f1d1d'}`,
              padding: '2px 8px', borderRadius: 4,
            }}>
              {m.tipo}
            </span>
            <div style={{
              fontFamily: 'monospace', fontWeight: 700, fontSize: 16, minWidth: 110, textAlign: 'right',
              color: m.tipo === 'ingreso' ? '#4ade80' : '#f87171',
            }}>
              {m.tipo === 'ingreso' ? '+' : '-'}{formatMoney(m.monto)}
            </div>
          </div>
        ))}
      </div>

      {modalNuevo && (
        <ModalMovimiento onClose={() => setModal(false)} onCreado={() => { setModal(false); cargar(); }} />
      )}
    </div>
  );
}

function ModalMovimiento({ onClose, onCreado }) {
  const [form, setForm] = useState({
    tipo: 'ingreso', monto: '', concepto: '', fecha: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const { show, Toast } = useToast();
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    if (!form.monto || !form.concepto) { show('Monto y concepto requeridos', 'error'); return; }
    setSaving(true);
    try {
      await api.caja.crear(form);
      onCreado();
    } catch (err) { show(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Nuevo movimiento" onClose={onClose} width={420}>
      {Toast}
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select label="Tipo *" value={form.tipo} onChange={set('tipo')}
          options={[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]} />
        <Input label="Monto ($) *" value={form.monto} onChange={set('monto')} type="number" placeholder="0" autoFocus />
        <Input label="Concepto *" value={form.concepto} onChange={set('concepto')} placeholder="Descripción del movimiento" />
        <Input label="Fecha" value={form.fecha} onChange={set('fecha')} type="date" />
        <Btn type="submit" disabled={saving} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
          {saving ? 'Guardando...' : '✓ Registrar'}
        </Btn>
      </form>
    </Modal>
  );
}
