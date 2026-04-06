import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Spinner } from '../ui/index.jsx';

const QUICK_WORKS = ['Alesado', 'Plano', 'Lapeado', 'Válvulas', 'Bielas', 'Tapa'];

const QUICK_DATES = [
  { label: 'Hoy',     days: 0 },
  { label: 'Mañana',  days: 1 },
  { label: '7 días',  days: 7 },
  { label: '14 días', days: 14 },
];

export default function FastOrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  // Cliente
  const [clientSearch, setClientSearch]   = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient]         = useState({ nombre: '', telefono: '', observaciones: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const searchTimer = useRef(null);
  const searchInputRef = useRef(null);

  // Motor — chips en lugar de select
  const [motors, setMotors]           = useState([]);
  const [selectedMotorId, setSelectedMotorId] = useState('');
  const [newMotorName, setNewMotorName]       = useState('');
  const [showNewMotor, setShowNewMotor]       = useState(false);

  // Trabajo / precio / fecha
  const [tipoTrabajo, setTipoTrabajo] = useState('');
  const [customTrabajo, setCustomTrabajo] = useState('');
  const [precio, setPrecio]           = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [quickDateSel, setQuickDateSel] = useState(null);

  // Inicializar fecha: 7 días por defecto
  useEffect(() => {
    applyQuickDate(7, 2);
  }, []);

  function applyQuickDate(days, idx) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFechaEntrega(d.toISOString().split('T')[0]);
    setQuickDateSel(idx);
  }

  // Búsqueda de clientes con debounce
  useEffect(() => {
    if (clientSearch.length < 2 || selectedClient) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.buscar(clientSearch);
        setSearchResults(res?.clientes || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 280);
  }, [clientSearch, selectedClient]);

  // Cargar motores del cliente seleccionado
  useEffect(() => {
    if (selectedClient?.id) {
      api.motores.listar({ clienteId: selectedClient.id }).then(ms => {
        setMotors(ms || []);
        // Auto-seleccionar el último motor usado
        if (ms?.length === 1) setSelectedMotorId(ms[0].id);
        else setSelectedMotorId('');
        setShowNewMotor(false);
        setNewMotorName('');
      });
    } else {
      setMotors([]);
      setSelectedMotorId('');
    }
  }, [selectedClient]);

  function showToast(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  function selectClient(c) {
    setSelectedClient(c);
    setClientSearch('');
    setSearchResults([]);
    setShowNewClient(false);
  }

  function clearClient() {
    setSelectedClient(null);
    setShowNewClient(false);
    setNewClient({ nombre: '', telefono: '', observaciones: '' });
    setMotors([]);
    setSelectedMotorId('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  function selectMotor(id) {
    setSelectedMotorId(id);
    setShowNewMotor(false);
    setNewMotorName('');
  }

  const trabajoFinal = QUICK_WORKS.includes(tipoTrabajo) ? tipoTrabajo : customTrabajo;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!trabajoFinal) return showToast('Seleccioná un tipo de trabajo', 'error');
    if (!precio)       return showToast('Ingresá el precio', 'error');

    setSaving(true);
    try {
      let clientId = selectedClient?.id;
      let motorId  = selectedMotorId;

      if (showNewClient) {
        if (!newClient.nombre) { showToast('Ingresá el nombre del cliente', 'error'); setSaving(false); return; }
        const c = await api.clientes.crear(newClient);
        clientId = c.id;
      }

      if (!motorId || motorId === 'new' || showNewMotor) {
        const m = await api.motores.crear({
          clienteId: clientId,
          tipoMotor: newMotorName.trim() || 'Motor s/n',
        });
        motorId = m.id;
      }

      await api.ordenes.crear({
        clienteId: clientId,
        motorId,
        tipoTrabajo: trabajoFinal,
        precio: parseFloat(precio),
        fechaEntregaEstimada: fechaEntrega,
      });

      showToast('✓ Orden creada');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      showToast(err.message || 'Error al crear la orden', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (saving) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <Spinner />
      <div style={{ color: '#64748b', marginTop: 16, fontSize: 14 }}>Creando orden...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto' }}>

      {/* Toast */}
      {msg && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: 340, width: '90%',
          background: msg.type === 'error' ? '#7f1d1d' : '#14532d',
          color: '#fff', padding: '12px 18px', borderRadius: 12,
          fontWeight: 700, fontSize: 14,
          border: `1px solid ${msg.type === 'error' ? '#991b1b' : '#166534'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.2s ease',
        }}>
          {msg.text}
        </div>
      )}

      {/* HEADER */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
        borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111418',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >←</button>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '0.03em' }}>
          Nueva Orden
        </h2>
      </div>

      {/* FORM */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 14px 120px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── CLIENTE ───────────────────────────────── */}
          <Section label="Cliente">
            {!selectedClient && !showNewClient ? (
              <div style={{ position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  className="taller-input"
                  placeholder="Buscar por nombre o teléfono..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  autoFocus
                />
                {searching && (
                  <div style={{ position: 'absolute', right: 14, top: 14 }}>
                    <MiniSpinner />
                  </div>
                )}

                {/* Resultados */}
                {(searchResults.length > 0 || (clientSearch.length >= 2 && !searching)) && (
                  <div style={dropdownStyle}>
                    {searchResults.map(c => (
                      <div key={c.id} style={ddItemStyle} onClick={() => selectClient(c)}>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>{c.nombre}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.telefono}</div>
                      </div>
                    ))}
                    {clientSearch.length >= 2 && (
                      <div
                        style={{ ...ddItemStyle, color: '#dc2626', fontWeight: 700, borderTop: searchResults.length ? '1px solid #1e293b' : 'none' }}
                        onClick={() => {
                          setShowNewClient(true);
                          setNewClient(n => ({ ...n, nombre: clientSearch }));
                        }}
                      >
                        <span style={{ fontSize: 16, marginRight: 8 }}>+</span>
                        Crear cliente "{clientSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

            ) : showNewClient ? (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nuevo cliente</span>
                  <button type="button" onClick={clearClient} style={cancelBtnStyle}>✕ Cancelar</button>
                </div>
                <input className="taller-input" placeholder="Nombre completo *" value={newClient.nombre}
                  onChange={e => setNewClient(n => ({ ...n, nombre: e.target.value }))} autoFocus />
                <input className="taller-input" type="tel" placeholder="Teléfono" value={newClient.telefono}
                  onChange={e => setNewClient(n => ({ ...n, telefono: e.target.value }))} />
                <input className="taller-input" placeholder="Observaciones (opcional)" value={newClient.observaciones}
                  onChange={e => setNewClient(n => ({ ...n, observaciones: e.target.value }))} />
              </div>

            ) : (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{selectedClient.nombre}</div>
                  {selectedClient.telefono && (
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{selectedClient.telefono}</div>
                  )}
                </div>
                <button type="button" onClick={clearClient} style={cancelBtnStyle}>Cambiar</button>
              </div>
            )}
          </Section>

          {/* ── MOTOR ─────────────────────────────────── */}
          <Section label="Motor">
            {/* Chips de motores del cliente */}
            {motors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: showNewMotor ? 10 : 0 }}>
                {motors.map(m => (
                  <ChipBtn
                    key={m.id}
                    label={`${m.tipo_motor}`}
                    sub={m.code}
                    selected={selectedMotorId === m.id && !showNewMotor}
                    onClick={() => selectMotor(m.id)}
                  />
                ))}
                <ChipBtn
                  label="+ Otro motor"
                  selected={showNewMotor}
                  onClick={() => { setShowNewMotor(true); setSelectedMotorId(''); }}
                  accent
                />
              </div>
            )}

            {/* Si no hay motores o eligió "Otro" */}
            {(motors.length === 0 || showNewMotor) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {motors.length === 0 && !selectedClient && (
                  <div style={{ fontSize: 13, color: '#475569', padding: '10px 0' }}>
                    Seleccioná un cliente primero para ver sus motores
                  </div>
                )}
                {(motors.length === 0 && selectedClient) || showNewMotor ? (
                  <input
                    className="taller-input"
                    placeholder="Ej: Fiat Fire 1.4"
                    value={newMotorName}
                    onChange={e => setNewMotorName(e.target.value)}
                    autoFocus={showNewMotor}
                  />
                ) : null}
              </div>
            )}
          </Section>

          {/* ── TIPO DE TRABAJO ───────────────────────── */}
          <Section label="Tipo de trabajo">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {QUICK_WORKS.map(w => (
                <ChipBtn
                  key={w}
                  label={w}
                  selected={tipoTrabajo === w}
                  onClick={() => { setTipoTrabajo(w); setCustomTrabajo(''); }}
                  big
                />
              ))}
            </div>
            <input
              className="taller-input"
              placeholder="Otro trabajo..."
              value={customTrabajo}
              onChange={e => { setCustomTrabajo(e.target.value); setTipoTrabajo(''); }}
              style={{ marginTop: 10 }}
            />
          </Section>

          {/* ── PRECIO ────────────────────────────────── */}
          <Section label="Precio">
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#090a0c', border: `1px solid ${precio ? '#dc2626' : '#1f2937'}`,
              borderRadius: 14, padding: '10px 16px', gap: 8,
              transition: 'border-color 0.2s',
              boxShadow: precio ? '0 0 12px rgba(220,38,38,0.15)' : 'none',
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>$</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: '#f1f5f9', fontSize: 26, fontWeight: 800,
                  fontFamily: 'monospace', width: '100%',
                  padding: 0,
                }}
              />
            </div>
          </Section>

          {/* ── FECHA ENTREGA ─────────────────────────── */}
          <Section label="Fecha de entrega">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {QUICK_DATES.map((qd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyQuickDate(qd.days, i)}
                  style={{
                    flex: 1, padding: '11px 4px',
                    background: quickDateSel === i ? '#1a0a0a' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${quickDateSel === i ? '#dc2626' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, color: quickDateSel === i ? '#f87171' : '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {qd.label}
                </button>
              ))}
            </div>
            <input
              className="taller-input"
              type="date"
              value={fechaEntrega}
              onChange={e => { setFechaEntrega(e.target.value); setQuickDateSel(null); }}
            />
          </Section>

          {/* ── BOTÓN CREAR ───────────────────────────── */}
          <button
            type="submit"
            className="btn-glossy-red"
            style={{ marginTop: 8, fontSize: 15, letterSpacing: '0.08em' }}
            disabled={saving}
          >
            {saving ? 'Creando...' : 'CREAR ORDEN'}
          </button>

        </form>
      </div>
    </div>
  );
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#475569',
        textTransform: 'uppercase', letterSpacing: '0.09em',
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {label}
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {children}
    </div>
  );
}

function ChipBtn({ label, sub, selected, onClick, accent, big }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: big ? '13px 6px' : '9px 12px',
        background: selected
          ? (accent ? 'rgba(220,38,38,0.15)' : '#1a0a0a')
          : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${selected ? '#dc2626' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        color: selected ? (accent ? '#dc2626' : '#f87171') : '#64748b',
        fontSize: 13, fontWeight: 700,
        cursor: 'pointer', textAlign: 'center',
        transition: 'all 0.15s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        minHeight: big ? 48 : 'auto',
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>{sub}</span>}
    </button>
  );
}

function MiniSpinner() {
  return (
    <>
      <div style={{
        width: 16, height: 16,
        border: '2px solid #1e293b',
        borderTop: '2px solid #dc2626',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const dropdownStyle = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
  background: '#111827', border: '1px solid #1e293b',
  borderRadius: 12, zIndex: 200, overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const ddItemStyle = {
  padding: '13px 16px', cursor: 'pointer',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'background 0.1s',
};

const cancelBtnStyle = {
  background: 'none',
  border: '1px solid rgba(220,38,38,0.4)',
  color: '#dc2626', padding: '5px 10px',
  borderRadius: 8, fontSize: 12,
  cursor: 'pointer', fontWeight: 700,
};
