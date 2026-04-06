import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, TIPOS_TRABAJO, formatMoney, formatDate, ESTADOS } from '../lib/api.js';
import {
  EstadoBadge, MotorCode, Btn, Input, Select, Textarea,
  Card, Modal, Spinner, Empty, useToast
} from '../components/ui/index.jsx';

// ── Lista de órdenes ──────────────────────────────────────────────────────────
export function Ordenes() {
  const [ordenes, setOrdenes]   = useState([]);
  const [filtro, setFiltro]     = useState('');
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const data = await api.ordenes.listar(filtro ? { estado: filtro } : {});
      setOrdenes(data);
      setLoading(false);
    })();
  }, [filtro]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Órdenes de trabajo</h1>
        <Btn onClick={() => navigate('/ordenes/nueva')}>+ Nueva orden</Btn>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ v:'', l:'Todas' }, ...ESTADOS.map(e => ({ v:e, l:e.replace('_',' ') }))].map(({ v, l }) => (
          <button key={v} onClick={() => setFiltro(v)}
            style={{
              background: filtro === v ? '#dc2626' : '#111827',
              color: filtro === v ? '#fff' : '#64748b',
              border: `1px solid ${filtro === v ? '#dc2626' : '#1e293b'}`,
              borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
            }}>
            {l}
          </button>
        ))}
      </div>

      {ordenes.length === 0 && <Empty msg="Sin órdenes con ese filtro" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordenes.map(o => (
          <Card key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}
            style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              alignItems: window.innerWidth <= 768 ? 'stretch' : 'center', 
              gap: 16, 
              padding: '16px 20px' 
            }}>
            <MotorCode code={o.motor_code} size="sm" />
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{o.tipo_trabajo}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{o.cliente_nombre}</div>
            </div>
            <div style={{ color: '#64748b', fontSize: 12 }}>
              Ingreso: {formatDate(o.fecha_ingreso)}<br/>
              {o.fecha_entrega_estimada && <>Entrega: {formatDate(o.fecha_entrega_estimada)}</>}
            </div>
            <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 15 }}>
              {formatMoney(o.precio)}
            </div>
            <EstadoBadge estado={o.estado} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Nueva orden ───────────────────────────────────────────────────────────────
export function NuevaOrden() {
  const navigate = useNavigate();
  const { show, Toast } = useToast();

  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    clienteId:'', motorCode:'', tipoTrabajo:'', sobremedida:'',
    fechaIngreso: new Date().toISOString().slice(0,10),
    fechaEntregaEstimada:'', precio:'', observaciones:'',
  });
  const [motorInfo, setMotorInfo]   = useState(null);
  const [motorError, setMotorError] = useState('');
  const [saving, setSaving]         = useState(false);
  const [nuevoMotor, setNuevoMotor] = useState(false);
  const [tipoMotorNuevo, setTipoMotorNuevo] = useState('');

  useEffect(() => {
    api.clientes.listar().then(setClientes);
  }, []);

  async function buscarMotor(code) {
    if (!code || code.length < 4) { setMotorInfo(null); return; }
    try {
      const m = await api.motores.porCodigo(code.toUpperCase());
      setMotorInfo(m);
      setMotorError('');
      setForm(f => ({ ...f, clienteId: m.cliente_id }));
    } catch {
      setMotorInfo(null);
      setMotorError('Motor no encontrado. ¿Desea crear uno nuevo?');
    }
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.clienteId || !form.tipoTrabajo) {
      show('Completá los campos obligatorios', 'error'); return;
    }
    setSaving(true);
    try {
      let motorId = motorInfo?.id;

      if (!motorId) {
        // Crear motor nuevo automáticamente
        const m = await api.motores.crear({
          clienteId: form.clienteId,
          tipoMotor: tipoMotorNuevo || 'Sin especificar',
        });
        motorId = m.id;
      }

      const orden = await api.ordenes.crear({
        clienteId:            form.clienteId,
        motorId,
        tipoTrabajo:          form.tipoTrabajo,
        sobremedida:          form.sobremedida || null,
        fechaIngreso:         form.fechaIngreso,
        fechaEntregaEstimada: form.fechaEntregaEstimada || null,
        precio:               form.precio || null,
        observaciones:        form.observaciones,
      });

      show('Orden creada: ' + orden.numero_orden);
      setTimeout(() => navigate(`/ordenes/${orden.id}`), 800);
    } catch (err) {
      show(err.message, 'error');
    } finally { setSaving(false); }
  }

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ maxWidth: 640 }}>
      {Toast}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>← Volver</Btn>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Nueva orden</h1>
      </div>

      <form onSubmit={guardar}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Código de motor */}
          <div>
            <Input label="Código de motor (G26-XXXX)" value={form.motorCode}
              onChange={v => { set('motorCode')(v); buscarMotor(v); }}
              placeholder="Ej: G26-0042" autoFocus />
            {motorInfo && (
              <div style={{ marginTop: 8, background: '#052e16', border: '1px solid #14532d', borderRadius: 6, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <MotorCode code={motorInfo.code} size="sm" />
                <span style={{ color: '#4ade80', fontSize: 13 }}>
                  {motorInfo.tipo_motor} — {motorInfo.cliente_nombre}
                </span>
              </div>
            )}
            {motorError && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#fb923c', fontSize: 13, marginBottom: 8 }}>{motorError}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
                  <input type="checkbox" checked={nuevoMotor} onChange={e => setNuevoMotor(e.target.checked)} />
                  Crear motor nuevo para este trabajo
                </label>
                {nuevoMotor && (
                  <div style={{ marginTop: 10 }}>
                    <Input label="Tipo de motor" value={tipoMotorNuevo} onChange={setTipoMotorNuevo}
                      placeholder="Ej: Chevrolet 350, Ford 221..." />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cliente */}
          <Select label="Cliente" value={form.clienteId} onChange={set('clienteId')} required
            placeholder="Seleccionar cliente..."
            options={clientes.map(c => ({ value: c.id, label: c.nombre }))} />

          {/* Tipo de trabajo */}
          <Select label="Tipo de trabajo" value={form.tipoTrabajo} onChange={set('tipoTrabajo')} required
            placeholder="Seleccionar trabajo..."
            options={TIPOS_TRABAJO} />

          {/* Sobremedida + Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Sobremedida (mm)" value={form.sobremedida} onChange={set('sobremedida')}
              placeholder="Ej: 0.25, 0.50" type="text" />
            <Input label="Precio ($)" value={form.precio} onChange={set('precio')}
              placeholder="0" type="number" />
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Fecha ingreso" value={form.fechaIngreso} onChange={set('fechaIngreso')} type="date" required />
            <Input label="Entrega estimada" value={form.fechaEntregaEstimada} onChange={set('fechaEntregaEstimada')} type="date" />
          </div>

          <Textarea label="Observaciones" value={form.observaciones} onChange={set('observaciones')}
            placeholder="Notas del trabajo..." />

          <Btn type="submit" size="lg" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Guardando...' : '✓ Crear orden de trabajo'}
          </Btn>
        </Card>
      </form>
    </div>
  );
}

// ── Detalle de orden ──────────────────────────────────────────────────────────
export function OrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show, Toast } = useToast();

  const [orden, setOrden]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editTecnico, setEditTec] = useState(false);
  const [tecnico, setTecnico]     = useState({});
  const [savingTec, setSavTec]    = useState(false);
  const [showDel, setShowDel]     = useState(false);
  const [deleting, setDeleting]   = useState(false);

  async function cargar() {
    try {
      const o = await api.ordenes.obtener(id);
      setOrden(o);
      setTecnico({
        diametroOriginal: o.diametro_original || '',
        diametroFinal:    o.diametro_final || '',
        tolerancia:       o.tolerancia || '',
        juegoPiston:      o.juego_piston || '',
        observaciones:    o.obs_tecnicas || '',
      });
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [id]);

  async function cambiarEstado(estado) {
    await api.ordenes.estado(id, estado);
    show('Estado actualizado');
    cargar();
  }

  async function guardarTecnico() {
    setSavTec(true);
    try {
      await api.ordenes.tecnico(id, tecnico);
      show('Registro técnico guardado');
      setEditTec(false);
      cargar();
    } catch (e) {
      show(e.message, 'error');
    } finally { setSavTec(false); }
  }

  if (loading) return <Spinner />;
  if (!orden) return <div style={{ color: '#ef4444' }}>Orden no encontrada</div>;

  const NEXT = { ingresado:'en_proceso', en_proceso:'terminado', terminado:'entregado' };
  const NEXT_LBL = { ingresado:'▶ Iniciar trabajo', en_proceso:'✓ Marcar terminado', terminado:'📦 Marcar entregado' };

  return (
    <div>
      {Toast}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>← Volver</Btn>
        <MotorCode code={orden.motor_code} size="lg" />
        <span style={{ color: '#475569', fontFamily: 'monospace' }}>{orden.numero_orden}</span>
        <EstadoBadge estado={orden.estado} />
        {NEXT[orden.estado] && (
          <Btn onClick={() => cambiarEstado(NEXT[orden.estado])} style={{ marginLeft: 'auto' }}>
            {NEXT_LBL[orden.estado]}
          </Btn>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Info principal */}
        <Card>
          <h3 style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trabajo</h3>
          <Row label="Tipo"     value={orden.tipo_trabajo} />
          <Row label="Cliente"  value={orden.cliente_nombre} />
          <Row label="Teléfono" value={orden.cliente_telefono} />
          <Row label="Sobremedida" value={orden.sobremedida ? `${orden.sobremedida} mm` : '—'} />
          <Row label="Precio"   value={formatMoney(orden.precio)} highlight />
          <Row label="Ingreso"  value={formatDate(orden.fecha_ingreso)} />
          <Row label="Entrega est." value={formatDate(orden.fecha_entrega_estimada)} />
          {orden.fecha_entrega_real && <Row label="Entrega real" value={formatDate(orden.fecha_entrega_real)} />}
          {orden.observaciones && (
            <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13, borderTop: '1px solid #1e293b', paddingTop: 12 }}>
              {orden.observaciones}
            </div>
          )}
        </Card>

        {/* Registro técnico */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registro técnico</h3>
            <Btn size="sm" variant="ghost" onClick={() => setEditTec(true)}>Editar</Btn>
          </div>
          <Row label="Diám. original" value={orden.diametro_original ? `${orden.diametro_original} mm` : '—'} />
          <Row label="Diám. final"    value={orden.diametro_final    ? `${orden.diametro_final} mm`    : '—'} />
          <Row label="Tolerancia"     value={orden.tolerancia        ? `${orden.tolerancia} mm`        : '—'} />
          <Row label="Juego pistón"   value={orden.juego_piston      ? `${orden.juego_piston} mm`      : '—'} />
          {orden.obs_tecnicas && (
            <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13, borderTop: '1px solid #1e293b', paddingTop: 12 }}>
              {orden.obs_tecnicas}
            </div>
          )}
        </Card>
      </div>

      {/* Modal registro técnico */}
      {editTecnico && (
        <Modal title="Registro técnico" onClose={() => setEditTec(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input label="Diámetro original (mm)" value={tecnico.diametroOriginal}
                onChange={v => setTecnico(t => ({...t, diametroOriginal: v}))} type="number" />
              <Input label="Diámetro final (mm)" value={tecnico.diametroFinal}
                onChange={v => setTecnico(t => ({...t, diametroFinal: v}))} type="number" />
              <Input label="Tolerancia (mm)" value={tecnico.tolerancia}
                onChange={v => setTecnico(t => ({...t, tolerancia: v}))} type="number" />
              <Input label="Juego pistón/cilindro (mm)" value={tecnico.juegoPiston}
                onChange={v => setTecnico(t => ({...t, juegoPiston: v}))} type="number" />
            </div>
            <Textarea label="Observaciones técnicas" value={tecnico.observaciones}
              onChange={v => setTecnico(t => ({...t, observaciones: v}))} />
            <Btn onClick={guardarTecnico} disabled={savingTec} size="lg" style={{ width:'100%', justifyContent:'center' }}>
              {savingTec ? 'Guardando...' : '✓ Guardar registro'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Botón de eliminación (Trash) */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
        <Btn variant="ghost" onClick={() => setShowDel(true)} 
          style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13 }}>
          🗑️ Eliminar esta orden permanentemente
        </Btn>
      </div>

      {/* Confirmación eliminación */}
      {showDel && (
        <Modal title="⚠ ¿Eliminar orden?" onClose={() => setShowDel(false)}>
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 24 }}>
              Esta acción no se puede deshacer. La orden **{orden.numero_orden}** será borrada de la base de datos.
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

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f172a' }}>
      <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
      <span style={{ color: highlight ? '#4ade80' : '#e2e8f0', fontSize: 14, fontWeight: highlight ? 700 : 400 }}>
        {value || '—'}
      </span>
    </div>
  );
}
