import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, formatDate, formatMoney } from '../lib/api.js';
import {
  EstadoBadge, MotorCode, Btn, Input, Select, Textarea,
  Card, Modal, Spinner, Empty, useToast, StatCard
} from '../components/ui/index.jsx';

// ── Lista de Motores ──────────────────────────────────────────────────────────
export function Motores() {
  const [motores, setMotores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const navigate = useNavigate();

  async function cargar() {
    const data = await api.motores.listar();
    setMotores(data);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Motores</h1>
        <Btn onClick={() => setModalNuevo(true)}>+ Nuevo motor</Btn>
      </div>

      {motores.length === 0 && <Empty msg="No hay motores registrados" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {motores.map(m => (
          <Card key={m.id} onClick={() => navigate(`/motores/${m.id}`)} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <MotorCode code={m.code} size="md" />
              <span style={{ color: '#334155', fontSize: 11, fontFamily: 'monospace' }}>
                {formatDate(m.created_at)}
              </span>
            </div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {m.tipo_motor || 'Tipo no especificado'}
            </div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>
              {m.cliente_nombre}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#475569' }}>
              <span>⚙ {m.total_ordenes} {parseInt(m.total_ordenes) === 1 ? 'trabajo' : 'trabajos'}</span>
              {m.ultima_actividad && (
                <span>· última act. {formatDate(m.ultima_actividad)}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {modalNuevo && (
        <ModalNuevoMotor onClose={() => setModalNuevo(false)} onCreado={() => { setModalNuevo(false); cargar(); }} />
      )}
    </div>
  );
}

// ── Modal nuevo motor ─────────────────────────────────────────────────────────
function ModalNuevoMotor({ onClose, onCreado }) {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ clienteId: '', tipoMotor: '', observaciones: '' });
  const [saving, setSaving] = useState(false);
  const [motorCreado, setMotorCreado] = useState(null);
  const { show, Toast } = useToast();

  useEffect(() => { api.clientes.listar().then(setClientes); }, []);

  async function guardar(e) {
    e.preventDefault();
    if (!form.clienteId) { show('Seleccioná un cliente', 'error'); return; }
    setSaving(true);
    try {
      const m = await api.motores.crear(form);
      setMotorCreado(m);
    } catch (err) {
      show(err.message, 'error');
    } finally { setSaving(false); }
  }

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  if (motorCreado) {
    return (
      <Modal title="Motor creado" onClose={onCreado} width={400}>
        {Toast}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Código asignado:</div>
          <MotorCode code={motorCreado.code} size="xl" />
          <div style={{ marginTop: 20, padding: '12px 20px', background: '#1c1917', borderRadius: 8, border: '1px solid #292524' }}>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>⚠ Escribir este código en el motor con pintura</div>
            <div style={{ color: '#fb923c', fontFamily: 'monospace', fontSize: 18, fontWeight: 700 }}>{motorCreado.code}</div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn variant="ghost" onClick={onCreado}>Cerrar</Btn>
            <Btn onClick={onCreado}>Continuar</Btn>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Nuevo motor" onClose={onClose} width={480}>
      {Toast}
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Código automático
          </div>
          <div style={{ color: '#475569', fontSize: 13 }}>
            El sistema generará un código único G{new Date().getFullYear().toString().slice(-2)}-XXXX al guardar.
          </div>
        </div>

        <Select label="Cliente *" value={form.clienteId} onChange={set('clienteId')} required
          placeholder="Seleccionar cliente..."
          options={clientes.map(c => ({ value: c.id, label: c.nombre }))} />

        <Input label="Tipo de motor" value={form.tipoMotor} onChange={set('tipoMotor')}
          placeholder="Ej: Chevrolet 350, Ford 221, Renault F7..." />

        <Textarea label="Observaciones" value={form.observaciones} onChange={set('observaciones')}
          placeholder="Notas sobre el motor..." rows={2} />

        <Btn type="submit" disabled={saving} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
          {saving ? 'Generando código...' : '⚙ Registrar motor'}
        </Btn>
      </form>
    </Modal>
  );
}

// ── Detalle de Motor ──────────────────────────────────────────────────────────
export function MotorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, Toast } = useToast();
  const [motor, setMotor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.motores.porId(id).then(m => { setMotor(m); setLoading(false); });
  }, [id]);

  async function borrar() {
    setDeleting(true);
    try {
      await api.motores.borrar(id);
      show('Motor eliminado');
      navigate('/motores');
    } catch (e) {
      show(e.message, 'error');
    } finally { setDeleting(false); }
  }

  if (loading) return <Spinner />;
  if (!motor) return <div style={{ color: '#ef4444' }}>Motor no encontrado</div>;

  return (
    <div>
      {Toast}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>← Volver</Btn>
        <MotorCode code={motor.code} size="xl" />
        <Btn variant="ghost" size="sm" onClick={() => setShowDel(true)} 
          style={{ marginLeft: 'auto', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          🗑️ Borrar motor
        </Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Info del motor</h3>
          <Row label="Código" value={motor.code} mono />
          <Row label="Tipo" value={motor.tipo_motor || '—'} />
          <Row label="Cliente" value={motor.cliente_nombre} />
          <Row label="Teléfono" value={motor.cliente_telefono || '—'} />
          <Row label="Ingreso" value={formatDate(motor.created_at)} />
          {motor.observaciones && (
            <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13, borderTop: '1px solid #1e293b', paddingTop: 12 }}>
              {motor.observaciones}
            </div>
          )}
        </Card>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Historial de trabajos
            </h3>
            <Btn size="sm" onClick={() => navigate('/ordenes/nueva')}>+ Nueva orden</Btn>
          </div>

          {(!motor.ordenes || motor.ordenes.length === 0) && (
            <Empty msg="Sin trabajos registrados para este motor" />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(motor.ordenes || []).map(o => (
              <Card key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}
                style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{o.tipo_trabajo}</div>
                  <div style={{ color: '#475569', fontSize: 12, marginTop: 3, fontFamily: 'monospace' }}>{o.numero_orden}</div>
                  {o.sobremedida && (
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Sobremedida: {o.sobremedida} mm</div>
                  )}
                  {o.diametro_final && (
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Ø {o.diametro_original}→{o.diametro_final} mm · tol. {o.tolerancia} mm
                    </div>
                  )}
                </div>
                <div style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>
                  {formatDate(o.fecha_ingreso)}
                </div>
                <div style={{ color: '#60a5fa', fontWeight: 700 }}>
                  {formatMoney(o.precio)}
                </div>
                <EstadoBadge estado={o.estado} />
              </Card>
            ))}
          </div>
        </div>
      </div>

      {showDel && (
        <Modal title="⚠ ¿Eliminar motor?" onClose={() => setShowDel(false)}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
              Esta acción borrará el motor **{motor.code}** permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="ghost" onClick={() => setShowDel(false)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </Btn>
              <Btn onClick={borrar} disabled={deleting} 
                style={{ flex: 1, justifyContent: 'center', background: '#dc2626', borderColor: '#991b1b' }}>
                {deleting ? 'Borrando...' : 'Sí, eliminar'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Lista de Clientes ─────────────────────────────────────────────────────────
export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const navigate = useNavigate();

  async function cargar() {
    const data = await api.clientes.listar();
    setClientes(data);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Clientes</h1>
        <Btn onClick={() => setModalNuevo(true)}>+ Nuevo cliente</Btn>
      </div>

      {clientes.length === 0 && <Empty msg="No hay clientes registrados" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {clientes.map(c => (
          <Card key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}
            style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 120px', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{c.nombre}</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 2 }}>{c.telefono || '—'}</div>
            </div>
            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>{c.total_motores}</span> motores
            </div>
            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>{c.total_ordenes}</span> órdenes
            </div>
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'right' }}>
              Desde {formatDate(c.created_at)}
            </div>
          </Card>
        ))}
      </div>

      {modalNuevo && (
        <ModalNuevoCliente onClose={() => setModalNuevo(false)} onCreado={() => { setModalNuevo(false); cargar(); }} />
      )}
    </div>
  );
}

// ── Modal nuevo cliente ───────────────────────────────────────────────────────
function ModalNuevoCliente({ onClose, onCreado }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', observaciones: '' });
  const [saving, setSaving] = useState(false);
  const { show, Toast } = useToast();
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { show('Nombre requerido', 'error'); return; }
    setSaving(true);
    try {
      await api.clientes.crear(form);
      onCreado();
    } catch (err) { show(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose} width={440}>
      {Toast}
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Nombre *" value={form.nombre} onChange={set('nombre')} placeholder="Nombre completo o razón social" autoFocus required />
        <Input label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="221-XXX-XXXX" />
        <Textarea label="Observaciones" value={form.observaciones} onChange={set('observaciones')} placeholder="Notas del cliente..." rows={2} />
        <Btn type="submit" disabled={saving} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
          {saving ? 'Guardando...' : '✓ Crear cliente'}
        </Btn>
      </form>
    </Modal>
  );
}

// ── Detalle de Cliente ────────────────────────────────────────────────────────
export function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, Toast } = useToast();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.clientes.obtener(id).then(c => { setCliente(c); setLoading(false); });
  }, [id]);

  async function borrar() {
    setDeleting(true);
    try {
      await api.clientes.borrar(id);
      show('Cliente eliminado');
      navigate('/clientes');
    } catch (e) {
      show(e.message, 'error');
    } finally { setDeleting(false); }
  }

  if (loading) return <Spinner />;
  if (!cliente) return <div style={{ color: '#ef4444' }}>Cliente no encontrado</div>;

  return (
    <div>
      {Toast}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>← Volver</Btn>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{cliente.nombre}</h1>
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`} style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none', marginLeft: 8 }}>
            📞 {cliente.telefono}
          </a>
        )}
        <Btn variant="ghost" size="sm" onClick={() => setShowDel(true)} 
          style={{ marginLeft: 'auto', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          🗑️ Borrar cliente
        </Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Motores" value={cliente.motores?.length || 0} color="#60a5fa" />
        <StatCard label="Trabajos" value={cliente.motores?.reduce((a, m) => a + parseInt(m.total_ordenes || 0), 0)} color="#4ade80" />
        <StatCard label="Cliente desde" value={new Date(cliente.created_at).getFullYear()} color="#fb923c" />
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Motores</h3>
      {(!cliente.motores || cliente.motores.length === 0) && <Empty msg="Sin motores registrados" />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {(cliente.motores || []).map(m => (
          <Card key={m.id} onClick={() => navigate(`/motores/${m.id}`)} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <MotorCode code={m.code} size="sm" />
              <span style={{ color: '#475569', fontSize: 12 }}>{m.total_ordenes} trabajos</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{m.tipo_motor || '—'}</div>
          </Card>
        ))}
      </div>

      {showDel && (
        <Modal title="⚠ ¿Eliminar cliente?" onClose={() => setShowDel(false)}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
              Esta acción borrará al cliente **{cliente.nombre}** y todos sus datos asociados permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="ghost" onClick={() => setShowDel(false)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </Btn>
              <Btn onClick={borrar} disabled={deleting} 
                style={{ flex: 1, justifyContent: 'center', background: '#dc2626', borderColor: '#991b1b' }}>
                {deleting ? 'Borrando...' : 'Sí, eliminar'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value, mono, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f172a' }}>
      <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
      <span style={{
        color: highlight ? '#4ade80' : '#e2e8f0',
        fontSize: 14, fontWeight: highlight ? 700 : 400,
        fontFamily: mono ? '"Courier New", monospace' : 'inherit',
      }}>
        {value || '—'}
      </span>
    </div>
  );
}
