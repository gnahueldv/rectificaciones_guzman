// ── Componentes UI base para Rectificaciones Guzmán ─────────────────────────
import { useState } from 'react';

// Badge de estado
export function EstadoBadge({ estado, atrasado }) {
  const COLORS = {
    ingresado:  { bg: 'var(--status-ingresado)', label: 'Ingresado' },
    en_proceso: { bg: 'var(--status-en_proceso)', label: 'En proceso' },
    terminado:  { bg: 'var(--status-terminado)', label: 'Terminado' },
    entregado:  { bg: '#3b82f6', label: 'Entregado' },
    atrasado:   { bg: 'var(--status-atrasado)', label: 'Atrasado' },
  };
  const c = atrasado ? COLORS.atrasado : (COLORS[estado] || COLORS.ingresado);
  return (
    <span className="badge-status-pill" style={{ background: c.bg }}>
      {c.label}
    </span>
  );
}

// Código de motor (tipografía industrial)
export function MotorCode({ code, size = 'md' }) {
  const sizes = { sm: 13, md: 16, lg: 22, xl: 28 };
  return (
    <span style={{
      fontFamily: '"Courier New", Courier, monospace',
      fontWeight: 700,
      fontSize: sizes[size] || 16,
      color: '#ef4444',
      letterSpacing: '0.08em',
      background: '#1a0a0a',
      padding: size === 'xl' ? '6px 14px' : '2px 8px',
      borderRadius: 4,
      border: '1px solid #7f1d1d',
    }}>
      {code}
    </span>
  );
}

// Botón
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', style }) {
  const base = {
    border: 'none', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontFamily: 'inherit', transition: 'background 0.15s, opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    ...style,
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 15 },
    lg: { padding: '14px 28px', fontSize: 17 },
  };
  const variants = {
    primary: { background: '#dc2626', color: '#fff' },
    secondary: { background: '#1e293b', color: '#cbd5e1' },
    ghost: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
    success: { background: '#14532d', color: '#4ade80' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size] || sizes.md, ...variants[variant] || variants.primary }}>
      {children}
    </button>
  );
}

// Input
export function Input({ label, value, onChange, placeholder, type = 'text', required, autoFocus, list }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <input
        type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} autoFocus={autoFocus} list={list}
        style={{
          background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
          color: '#e2e8f0', padding: '10px 14px', fontSize: 15, fontFamily: 'inherit',
          outline: 'none', width: '100%', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#ef4444'}
        onBlur={e => e.target.style.borderColor = '#334155'}
      />
    </div>
  );
}

// Select
export function Select({ label, value, onChange, options, placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <select
        value={value || ''} onChange={e => onChange(e.target.value)} required={required}
        style={{
          background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
          color: value ? '#e2e8f0' : '#64748b', padding: '10px 14px', fontSize: 15,
          fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
          cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = '#ef4444'}
        onBlur={e => e.target.style.borderColor = '#334155'}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// Textarea
export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      )}
      <textarea
        value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
          color: '#e2e8f0', padding: '10px 14px', fontSize: 14, fontFamily: 'inherit',
          outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical',
        }}
        onFocus={e => e.target.style.borderColor = '#ef4444'}
        onBlur={e => e.target.style.borderColor = '#334155'}
      />
    </div>
  );
}

// Card
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} className="glassy-item" style={{
      padding: '20px', cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>
      {children}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, sub, color = '#ef4444' }) {
  return (
    <Card style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 36, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// Modal
export function Modal({ title, children, onClose, width = 520 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}
    onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111827', border: '1px solid #374151', borderRadius: 12,
        width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
        padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
            fontSize: 22, lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Toast simple
export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const Toast = toast ? (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: toast.type === 'error' ? '#7f1d1d' : '#14532d',
      color: toast.type === 'error' ? '#fca5a5' : '#bbf7d0',
      border: `1px solid ${toast.type === 'error' ? '#991b1b' : '#166534'}`,
      padding: '12px 20px', borderRadius: 8, fontWeight: 600,
      fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {toast.msg}
    </div>
  ) : null;
  return { show, Toast };
}

// Loading spinner
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #1e293b',
        borderTop: '3px solid #ef4444', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Empty state
export function Empty({ msg = 'Sin datos' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
      <div style={{ fontSize: 16 }}>{msg}</div>
    </div>
  );
}
